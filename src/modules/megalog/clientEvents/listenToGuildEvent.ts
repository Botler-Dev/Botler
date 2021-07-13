import {Logger} from '@/logger';
import {Client, ExportProxyClientEvents, Guild} from 'discord.js';
import {from, lastValueFrom, OperatorFunction} from 'rxjs';
import {catchError, filter, map, mergeMap, toArray} from 'rxjs/operators';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '.';
import {
  AuditLogMatcher,
  AuditLogMatchFilter,
  AuditLogMatchListener,
} from '../auditLog/AuditLogMatcher';
import {MegalogEventTypeAuditLogMatchCallback} from '../eventType/MegalogEventType';
import {MegalogEventTypeManager} from '../eventType/MegalogEventTypeManager';
import {MegalogChannelManager} from '../MegalogChannelManager';
import {fromClientEvent} from './fromClientEvent';
import {processSubscription} from './processSubscription';
import {MegalogGuildSubscriptions, withSubscriptions} from './withSubscriptions';

export type PayloadToGuildResolver<TEventName extends MegalogSupportedClientEvent> = (
  ...payload: ExportProxyClientEvents[TEventName]
) => Promise<Guild | undefined>;

function listenToClientEventWithSubscriptions<TEventName extends MegalogSupportedClientEvent>(
  client: Client,
  channelManager: MegalogChannelManager,
  eventTypeManager: MegalogEventTypeManager,
  eventName: TEventName,
  payloadToGuild: PayloadToGuildResolver<TEventName>,
  subscriptionProcessor: (
    payload: ExportProxyClientEvents[TEventName]
  ) => OperatorFunction<MegalogGuildSubscriptions<TEventName>, unknown>
) {
  const eventTypes = eventTypeManager.getClientListeners(eventName);
  fromClientEvent(client, eventName)
    .pipe(
      mergeMap(payload =>
        from(payloadToGuild(...payload)).pipe(
          filter((guild): guild is NonNullable<typeof guild> => !!guild),
          withSubscriptions<TEventName>(channelManager, eventTypes),
          filter(({subscriptions}) => subscriptions.length > 0),
          subscriptionProcessor(payload)
        )
      )
    )
    .subscribe();
}

export function listenToGuildEvent<TEventName extends MegalogSupportedClientEvent>(
  client: Client,
  logger: Logger,
  channelManager: MegalogChannelManager,
  eventTypeManager: MegalogEventTypeManager,
  eventName: TEventName,
  payloadToGuild: PayloadToGuildResolver<TEventName>
): void {
  listenToClientEventWithSubscriptions(
    client,
    channelManager,
    eventTypeManager,
    eventName,
    payloadToGuild,
    payload => source =>
      source.pipe(
        mergeMap(({subscriptions}) => from(subscriptions)),
        processSubscription(logger, payload)
      )
  );
}

export type PayloadToAuditLogMatchFilterResolver<TEventName extends MegalogSupportedClientEvent> = (
  ...payload: ExportProxyClientEvents[TEventName]
) => Promise<AuditLogMatchFilter | undefined>;

function wrapToAuditLogListener(
  logger: Logger
): OperatorFunction<MegalogEventTypeAuditLogMatchCallback[], AuditLogMatchListener> {
  return source =>
    source.pipe(
      map(
        (callbacks): AuditLogMatchListener =>
          entry =>
            lastValueFrom(
              from(callbacks).pipe(
                mergeMap(callback => callback(entry)),
                catchError(async error =>
                  logger.error(`An audit log callback threw an error.`, error)
                )
              )
            )
      )
    );
}

export function listenToGuildEventWithAuditLog<TEventName extends AuditLogSupportedClientEvent>(
  client: Client,
  logger: Logger,
  channelManager: MegalogChannelManager,
  eventTypeManager: MegalogEventTypeManager,
  auditLogMatcher: AuditLogMatcher,
  eventName: TEventName,
  payloadToGuild: PayloadToGuildResolver<TEventName>,
  payloadToAuditLogMatchFilter: PayloadToAuditLogMatchFilterResolver<TEventName>
): void {
  listenToClientEventWithSubscriptions(
    client,
    channelManager,
    eventTypeManager,
    eventName,
    payloadToGuild,
    payload => source =>
      source.pipe(
        mergeMap(({guild, subscriptions}) =>
          from(subscriptions).pipe(
            processSubscription(logger, payload),
            toArray(),
            wrapToAuditLogListener(logger),
            mergeMap(listener =>
              from(payloadToAuditLogMatchFilter(...payload)).pipe(
                filter(
                  (matchFilter): matchFilter is NonNullable<typeof matchFilter> => !!matchFilter
                ),
                map(matchFilter => auditLogMatcher.requestMatch(guild, listener, matchFilter))
              )
            )
          )
        )
      )
  );
}
