import {Guild, GuildAuditLogsActions, Role} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {
  ClientEventListenerType,
  PayloadToAuditLogMatchFilterResolver,
} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedRoleGuildClientEvent = never;

export type SupportedRoleAuditLogClientEvent = 'roleCreate' | 'roleDelete' | 'roleUpdate';

export type SupportedRoleGlobalClientEvent = never;

const roleToGuild = (role: Role): Guild => role.guild;

function roleToMatchFilter(
  action: keyof GuildAuditLogsActions
): PayloadToAuditLogMatchFilterResolver<'roleCreate' | 'roleDelete'> {
  return ({id: roleId}) => ({
    action,
    checker: entry => checkAuditLogEntryTargetId(entry, roleId),
  });
}

export const roleClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedRoleGuildClientEvent,
  SupportedRoleAuditLogClientEvent,
  SupportedRoleGlobalClientEvent
> = {
  roleCreate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: roleToGuild,
    filterResolver: roleToMatchFilter('ROLE_CREATE'),
  },
  roleDelete: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: roleToGuild,
    filterResolver: roleToMatchFilter('ROLE_DELETE'),
  },
  roleUpdate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: roleToGuild,
    filterResolver: (oldRole, newRole) => ({
      action: 'ROLE_UPDATE',
      checker: entry =>
        checkAuditLogEntryTargetId(entry, oldRole.id) &&
        (entry.changes ?? []).every(change => {
          switch (change.key) {
            case 'name':
              return oldRole.name === change.old && newRole.name === change.new;
            case 'permissions':
              return (
                oldRole.permissions.bitfield.toString() === change.old &&
                newRole.permissions.bitfield.toString() === change.new
              );
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
    }),
  },
};
