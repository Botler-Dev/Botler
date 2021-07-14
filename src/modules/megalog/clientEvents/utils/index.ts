import {Logger} from '@/logger';
import {Client} from 'discord.js';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '..';
import {AuditLogMatcher} from '../../auditLog/AuditLogMatcher';
import {MegalogEventTypeManager} from '../../eventType/MegalogEventTypeManager';
import {MegalogChannelManager} from '../../MegalogChannelManager';
import {
  listenToGuildEvent,
  listenToGuildEventWithAuditLog,
  PayloadToAuditLogMatchFilterResolver,
  PayloadToGuildResolver,
} from './listenToGuildEvent';

export interface MegalogClientEventUtils {
  listenToGuildEvent<TEventName extends MegalogSupportedClientEvent>(
    eventName: TEventName,
    payloadToGuild: PayloadToGuildResolver<TEventName>
  ): void;
  listenToGuildEventWithAuditLog<TEventName extends AuditLogSupportedClientEvent>(
    eventName: TEventName,
    payloadToGuild: PayloadToGuildResolver<TEventName>,
    payloadToAuditLogMatchFilter: PayloadToAuditLogMatchFilterResolver<TEventName>
  ): void;
}

export function getMegalogClientEventUtils(
  client: Client,
  logger: Logger,
  channelManager: MegalogChannelManager,
  eventTypeManager: MegalogEventTypeManager,
  auditLogMatcher: AuditLogMatcher
): MegalogClientEventUtils {
  return {
    listenToGuildEvent: <TEventName extends MegalogSupportedClientEvent>(
      eventName: TEventName,
      payloadToGuild: PayloadToGuildResolver<TEventName>
    ) =>
      listenToGuildEvent(
        client,
        logger,
        channelManager,
        eventTypeManager,
        eventName,
        payloadToGuild
      ),
    listenToGuildEventWithAuditLog: <TEventName extends AuditLogSupportedClientEvent>(
      eventName: TEventName,
      payloadToGuild: PayloadToGuildResolver<TEventName>,
      payloadToAuditLogMatchFilter: PayloadToAuditLogMatchFilterResolver<TEventName>
    ) =>
      listenToGuildEventWithAuditLog(
        client,
        logger,
        channelManager,
        eventTypeManager,
        auditLogMatcher,
        eventName,
        payloadToGuild,
        payloadToAuditLogMatchFilter
      ),
  };
}
