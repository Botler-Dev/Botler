import {ExportProxyClientEvents, Guild, GuildAuditLogsActions} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {
  MegalogClientEventUtils,
  PayloadToAuditLogMatchFilterResolver,
} from './utils/MegalogClientEventUtils';

export type MegalogSupportedBanClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'guildBanAdd' | 'guildBanRemove'
>;

export type AuditLogSupportedBanClientEvent = Extract<
  MegalogSupportedBanClientEvent,
  'guildBanAdd' | 'guildBanRemove'
>;

const guildToGuild = async (guild: Guild) => guild;

function payloadToMatchFilter(
  action: keyof GuildAuditLogsActions
): PayloadToAuditLogMatchFilterResolver<'guildBanAdd' | 'guildBanRemove'> {
  return async (_, {id: userId}) => ({
    action,
    checker: entry => checkAuditLogEntryTargetId(entry, userId),
  });
}

export function registerBanClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEventWithAuditLog(
    'guildBanAdd',
    guildToGuild,
    payloadToMatchFilter('MEMBER_BAN_ADD')
  );

  utils.listenToGuildEventWithAuditLog(
    'guildBanRemove',
    guildToGuild,
    payloadToMatchFilter('MEMBER_BAN_REMOVE')
  );
}
