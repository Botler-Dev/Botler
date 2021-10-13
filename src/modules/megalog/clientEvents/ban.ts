import {Guild, GuildAuditLogsActions, GuildBan} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {
  ClientEventListenerType,
  PayloadToAuditLogMatchFilterResolver,
} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedBanGuildClientEvent = never;

export type SupportedBanAuditLogClientEvent = 'guildBanAdd' | 'guildBanRemove';

export type SupportedBanGlobalClientEvent = never;

const guildToGuild = (ban: GuildBan): Guild => ban.guild;

function payloadToMatchFilter(
  action: keyof GuildAuditLogsActions
): PayloadToAuditLogMatchFilterResolver<'guildBanAdd' | 'guildBanRemove'> {
  return ({user: {id: userId}}) => ({
    action,
    checker: entry => checkAuditLogEntryTargetId(entry, userId),
  });
}

export const banClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedBanGuildClientEvent,
  SupportedBanAuditLogClientEvent,
  SupportedBanGlobalClientEvent
> = {
  guildBanAdd: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: guildToGuild,
    filterResolver: payloadToMatchFilter('MEMBER_BAN_ADD'),
  },
  guildBanRemove: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: guildToGuild,
    filterResolver: payloadToMatchFilter('MEMBER_BAN_REMOVE'),
  },
};
