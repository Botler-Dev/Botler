import {ExportProxyClientEvents, GuildMember, PartialGuildMember, Snowflake} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedMemberClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'guildMemberAdd' | 'guildMemberRemove' | 'guildMemberUpdate'
>;

export type AuditLogSupportedMemberClientEvent = Extract<
  MegalogSupportedMemberClientEvent,
  'guildMemberRemove' | 'guildMemberUpdate'
>;

const memberToGuild = async (member: GuildMember | PartialGuildMember) => member.guild;

export function registerMemberClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEvent('guildMemberAdd', memberToGuild);

  utils.listenToGuildEventWithAuditLog(
    'guildMemberRemove',
    memberToGuild,
    async ({id: memberId}) => ({
      checker: entry =>
        (entry.action === 'MEMBER_BAN_ADD' || entry.action === 'MEMBER_KICK') &&
        checkAuditLogEntryTargetId(entry, memberId),
    })
  );

  utils.listenToGuildEventWithAuditLog(
    'guildMemberUpdate',
    memberToGuild,
    async (oldMember, newMember) => ({
      checker: entry => {
        if (!checkAuditLogEntryTargetId(entry, oldMember.id)) return false;
        switch (entry.action) {
          case 'MEMBER_UPDATE':
            return (entry.changes ?? []).every(change => {
              switch (change.key) {
                case 'nick':
                  return (
                    (oldMember.nickname ?? undefined) === change.old &&
                    (newMember.nickname ?? undefined) === change.new
                  );
                // Avatar's are not supported yet by Discord.js v12
                case 'avatar_hash':
                default:
                  return false;
              }
            });
          case 'MEMBER_ROLE_UPDATE':
            return (entry.changes ?? []).every(change => {
              switch (change.key) {
                case '$add':
                  return (
                    change.new?.every(
                      ({id}: {id: Snowflake}) =>
                        !oldMember.roles.cache.has(id) && newMember.roles.cache.has(id)
                    ) ?? false
                  );
                case '$remove':
                  return (
                    change.new?.every(
                      ({id}: {id: Snowflake}) =>
                        oldMember.roles.cache.has(id) && !newMember.roles.cache.has(id)
                    ) ?? false
                  );
                default:
                  return false;
              }
            });
          default:
            return false;
        }
      },
    })
  );
}
