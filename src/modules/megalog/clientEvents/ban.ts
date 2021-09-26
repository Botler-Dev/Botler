import {Guild, GuildAuditLogsActions} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {
  ClientEventListenerType,
  PayloadToAuditLogMatchFilterResolver,
} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedBanGuildClientEvent = never;

export type SupportedBanAuditLogClientEvent = 'guildBanAdd' | 'guildBanRemove';

export type SupportedBanGlobalClientEvent = never;

const guildToGuild = (guild: Guild): Guild => guild;

function payloadToMatchFilter(
  action: keyof GuildAuditLogsActions
): PayloadToAuditLogMatchFilterResolver<'guildBanAdd' | 'guildBanRemove'> {
  return (_, {id: userId}) => ({
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
