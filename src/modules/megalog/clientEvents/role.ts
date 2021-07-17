import {ExportProxyClientEvents, GuildAuditLogsActions, Role} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {
  MegalogClientEventUtils,
  PayloadToAuditLogMatchFilterResolver,
} from './utils/MegalogClientEventUtils';

export type MegalogSupportedRoleClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'roleCreate' | 'roleDelete' | 'roleUpdate'
>;

export type AuditLogSupportedRoleClientEvent = Extract<
  MegalogSupportedRoleClientEvent,
  'roleCreate' | 'roleDelete' | 'roleUpdate'
>;

const roleToGuild = async (role: Role) => role.guild;

function roleToMatchFilter(
  action: keyof GuildAuditLogsActions
): PayloadToAuditLogMatchFilterResolver<'roleCreate' | 'roleDelete'> {
  return async ({id: roleId}) => ({
    action,
    checker: entry => checkAuditLogEntryTargetId(entry, roleId),
  });
}

export function registerRoleClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEvent('roleCreate', roleToGuild, roleToMatchFilter('ROLE_CREATE'));

  utils.listenToGuildEvent('roleDelete', roleToGuild, roleToMatchFilter('ROLE_DELETE'));

  utils.listenToGuildEvent('roleUpdate', roleToGuild, async (oldRole, newRole) => ({
    action: 'ROLE_UPDATE',
    checker: entry =>
      checkAuditLogEntryTargetId(entry, oldRole.id) &&
      (entry.changes ?? []).every(change => {
        switch (change.key) {
          case 'name':
            return oldRole.name === change.old && newRole.name === change.new;
          case 'permissions':
            return (
              oldRole.permissions.bitfield === change.old &&
              newRole.permissions.bitfield === change.new
            );
          // Legacy key is easier to check.
          case 'permissions_new':
            return true;
          case 'color':
            return oldRole.color === change.old && newRole.color === change.new;
          case 'hoist':
            return oldRole.hoist === change.old && newRole.hoist === change.new;
          case 'mentionable':
            return oldRole.mentionable === change.old && newRole.mentionable === change.new;
          default:
            return false;
        }
      }),
  }));
}
