import {Guild, GuildMember, PartialGuildMember, Snowflake} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {ClientEventListenerType} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedMemberGuildClientEvent = 'guildMemberAdd';

export type SupportedMemberAuditLogClientEvent = 'guildMemberRemove' | 'guildMemberUpdate';

export type SupportedMemberGlobalClientEvent = never;

const memberToGuild = (member: GuildMember | PartialGuildMember): Guild => member.guild;

export const memberClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedMemberGuildClientEvent,
  SupportedMemberAuditLogClientEvent,
  SupportedMemberGlobalClientEvent
> = {
  guildMemberAdd: {
    type: ClientEventListenerType.Guild,
    guildResolver: memberToGuild,
  },
  guildMemberRemove: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: memberToGuild,
    filterResolver: ({id: memberId}) => ({
      checker: entry =>
        (entry.action === 'MEMBER_BAN_ADD' || entry.action === 'MEMBER_KICK') &&
        checkAuditLogEntryTargetId(entry, memberId),
    }),
  },
  guildMemberUpdate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: memberToGuild,
    filterResolver: (oldMember, newMember) => ({
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
    }),
  },
};
