import {Logger} from '@/logger';
import {filterNullAndUndefined} from '@/utils/filterNullAndUndefined';
import {Client, ExportProxyClientEvents, Guild} from 'discord.js';
import {EMPTY, from, of} from 'rxjs';
import {concatMap, filter, map, mergeMap, takeWhile, toArray} from 'rxjs/operators';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '..';
import {AuditLogMatcher, AuditLogMatchFilter} from '../../auditLog/AuditLogMatcher';
import {MegalogEventTypeManager} from '../../eventType/MegalogEventTypeManager';
import {MegalogSubscriptionManager} from '../../MegalogSubscriptionManager';
import {fromClientEvent} from './fromClientEvent';
import {processChannel} from './processChannel';
import {withChannelProcessor} from './withChannelProcessor';
import {wrapToAuditLogListener} from './wrapToAuditLogListener';

export type PayloadToGuildResolver<TEventName extends MegalogSupportedClientEvent> = (
  ...payload: ExportProxyClientEvents[TEventName]
) => Promise<Guild | undefined>;

export type PayloadToAuditLogMatchFilterResolver<TEventName extends MegalogSupportedClientEvent> = (
  ...payload: ExportProxyClientEvents[TEventName]
) => Promise<AuditLogMatchFilter | undefined>;

export type GlobalEventGuildRelevanceFilter<TEventName extends MegalogSupportedClientEvent> = (
  guild: Guild,
  ...payload: ExportProxyClientEvents[TEventName]
) => Promise<boolean>;

export class MegalogClientEventUtils {
  private readonly client: Client;

  private readonly logger: Logger;

  private readonly subscriptionManager: MegalogSubscriptionManager;

  private readonly eventTypeManager: MegalogEventTypeManager;

  private readonly auditLogMatcher: AuditLogMatcher;

  constructor(
    client: Client,
    logger: Logger,
    subscriptionManager: MegalogSubscriptionManager,
    eventTypeManager: MegalogEventTypeManager,
    auditLogMatcher: AuditLogMatcher
  ) {
    this.client = client;
    this.logger = logger;
    this.subscriptionManager = subscriptionManager;
    this.eventTypeManager = eventTypeManager;
    this.auditLogMatcher = auditLogMatcher;
  }

  /**
   * Listen to a {@link MegalogSupportedClientEvent} that is only relevant to a single guild.
   */
  listenToGuildEvent<TEventName extends AuditLogSupportedClientEvent>(
    eventName: TEventName,
    payloadToGuild: PayloadToGuildResolver<TEventName>,
    payloadToAuditLogMatchFilter: PayloadToAuditLogMatchFilterResolver<TEventName>
  ): void;
  listenToGuildEvent<
    TEventName extends Exclude<MegalogSupportedClientEvent, AuditLogSupportedClientEvent>
  >(eventName: TEventName, payloadToGuild: PayloadToGuildResolver<TEventName>): void;
  listenToGuildEvent<TEventName extends MegalogSupportedClientEvent>(
    eventName: TEventName,
    payloadToGuild: PayloadToGuildResolver<TEventName>,
    payloadToAuditLogMatchFilter?: PayloadToAuditLogMatchFilterResolver<TEventName>
  ): void {
    const eventTypes = this.eventTypeManager.getClientListeners(eventName);
    if (eventTypes.length === 0) return;
    fromClientEvent(this.client, eventName)
      .pipe(
        concatMap(payload =>
          from(payloadToGuild(...payload)).pipe(
            filterNullAndUndefined(),
            mergeMap(guild =>
              from(eventTypes).pipe(
                withChannelProcessor(this.logger, payload),
                concatMap(({type, channelProcessor}) =>
                  of(this.subscriptionManager.getSubscribedChannel(type, guild)).pipe(
                    filterNullAndUndefined(),
                    processChannel(this.logger, channelProcessor)
                  )
                ),
                takeWhile(() => !!payloadToAuditLogMatchFilter),
                toArray(),
                filter(processors => processors.length > 0),
                wrapToAuditLogListener(this.logger),
                mergeMap(listener =>
                  from(payloadToAuditLogMatchFilter?.(...payload) ?? EMPTY).pipe(
                    filterNullAndUndefined(),
                    map(matchFilter =>
                      this.auditLogMatcher.requestMatch(guild, listener, matchFilter)
                    )
                  )
                )
              )
            )
          )
        )
      )
      .subscribe();
  }

  /**
   * Listen to a {@link MegalogSupportedClientEvent} that is relevant to all guilds.
   */
  listenToGlobalEvent<TEventName extends MegalogSupportedClientEvent>(
    eventName: TEventName,
    relevanceFilter: GlobalEventGuildRelevanceFilter<TEventName>
  ): void {
    const eventTypes = this.eventTypeManager.getClientListeners(eventName);
    if (eventTypes.length === 0) return;
    fromClientEvent(this.client, eventName)
      .pipe(
        concatMap(payload =>
          from(eventTypes).pipe(
            filter(type => this.subscriptionManager.hasSubscribers(type)),
            withChannelProcessor(this.logger, payload),
            concatMap(({type, channelProcessor}) =>
              from(this.subscriptionManager.getSubscribedChannels(type) ?? EMPTY).pipe(
                concatMap(channel =>
                  from(relevanceFilter(channel.guild, ...payload)).pipe(
                    takeWhile(relevant => relevant),
                    map(() => channel)
                  )
                ),
                processChannel(this.logger, channelProcessor)
              )
            )
          )
        )
      )
      .subscribe();
  }
}
