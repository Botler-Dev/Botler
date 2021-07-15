import {Logger} from '@/logger';
import {Client, ExportProxyClientEvents, Guild} from 'discord.js';
import {from, OperatorFunction} from 'rxjs';
import {filter, map, mergeMap, toArray} from 'rxjs/operators';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '..';
import {AuditLogMatcher, AuditLogMatchFilter} from '../../auditLog/AuditLogMatcher';
import {MegalogEventTypeManager} from '../../eventType/MegalogEventTypeManager';
import {MegalogChannelManager} from '../../MegalogChannelManager';
import {fromClientEvent} from './fromClientEvent';
import {processSubscription} from './processSubscription';
import {MegalogGuildSubscriptions, withSubscriptions} from './withSubscriptions';
import {wrapToAuditLogListener} from './wrapToAuditLogListener';

export type PayloadToGuildResolver<TEventName extends MegalogSupportedClientEvent> = (
  ...payload: ExportProxyClientEvents[TEventName]
) => Promise<Guild | undefined>;

export type PayloadToAuditLogMatchFilterResolver<TEventName extends MegalogSupportedClientEvent> = (
  ...payload: ExportProxyClientEvents[TEventName]
) => Promise<AuditLogMatchFilter | undefined>;

export class MegalogClientEventUtils {
  private readonly client: Client;

  private readonly logger: Logger;

  private readonly channelManager: MegalogChannelManager;

  private readonly eventTypeManager: MegalogEventTypeManager;

  private readonly auditLogMatcher: AuditLogMatcher;

  constructor(
    client: Client,
    logger: Logger,
    channelManager: MegalogChannelManager,
    eventTypeManager: MegalogEventTypeManager,
    auditLogMatcher: AuditLogMatcher
  ) {
    this.client = client;
    this.logger = logger;
    this.channelManager = channelManager;
    this.eventTypeManager = eventTypeManager;
    this.auditLogMatcher = auditLogMatcher;
  }

  private genericListenToClientEvent<TEventName extends MegalogSupportedClientEvent>(
    eventName: TEventName,
    payloadToGuild: PayloadToGuildResolver<TEventName>,
    subscriptionProcessor: (
      payload: ExportProxyClientEvents[TEventName]
    ) => OperatorFunction<MegalogGuildSubscriptions<TEventName>, unknown>
  ) {
    const eventTypes = this.eventTypeManager.getClientListeners(eventName);
    fromClientEvent(this.client, eventName)
      .pipe(
        mergeMap(payload =>
          from(payloadToGuild(...payload)).pipe(
            filter((guild): guild is NonNullable<typeof guild> => !!guild),
            withSubscriptions<TEventName>(this.channelManager, eventTypes),
            filter(({subscriptions}) => subscriptions.length > 0),
            subscriptionProcessor(payload)
          )
        )
      )
      .subscribe();
  }

  listenToGuildEvent<TEventName extends MegalogSupportedClientEvent>(
    eventName: TEventName,
    payloadToGuild: PayloadToGuildResolver<TEventName>
  ): void {
    this.genericListenToClientEvent(
      eventName,
      payloadToGuild,
      payload => source =>
        source.pipe(
          mergeMap(({subscriptions}) => from(subscriptions)),
          processSubscription(this.logger, payload)
        )
    );
  }

  listenToGuildEventWithAuditLog<TEventName extends AuditLogSupportedClientEvent>(
    eventName: TEventName,
    payloadToGuild: PayloadToGuildResolver<TEventName>,
    payloadToAuditLogMatchFilter: PayloadToAuditLogMatchFilterResolver<TEventName>
  ): void {
    this.genericListenToClientEvent(
      eventName,
      payloadToGuild,
      payload => source =>
        source.pipe(
          mergeMap(({guild, subscriptions}) =>
            from(subscriptions).pipe(
              processSubscription(this.logger, payload),
              toArray(),
              filter(processors => processors.length > 0),
              wrapToAuditLogListener(this.logger),
              mergeMap(listener =>
                from(payloadToAuditLogMatchFilter(...payload)).pipe(
                  filter(
                    (matchFilter): matchFilter is NonNullable<typeof matchFilter> => !!matchFilter
                  ),
                  map(matchFilter =>
                    this.auditLogMatcher.requestMatch(guild, listener, matchFilter)
                  )
                )
              )
            )
          )
        )
    );
  }
}
