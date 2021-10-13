import {Logger} from '@/logger';
import {filterNullAndUndefined} from '@/utils/filterNullAndUndefined';
import {Client, ClientEvents, Guild, Snowflake} from 'discord.js';
import {EMPTY, from, of, Subscription} from 'rxjs';
import {concatMap, filter, map, mergeMap, takeWhile, toArray} from 'rxjs/operators';
import type {MegalogSupportedClientEvent} from '..';
import {AuditLogMatcher, AuditLogMatchFilter} from '../../auditLog/AuditLogMatcher';
import {MegalogEventTypeManager} from '../../eventType/MegalogEventTypeManager';
import {MegalogIgnoreManager} from '../../MegalogIgnoreManager';
import {MegalogSubscriptionManager} from '../../MegalogSubscriptionManager';
import {fromClientEvent} from './stream/fromClientEvent';
import {processChannel} from './stream/processChannel';
import {takeIfNotIgnored} from './stream/takeIfNotIgnored';
import {withChannelProcessor} from './stream/withChannelProcessor';
import {wrapToAuditLogListener} from './stream/wrapToAuditLogListener';

export enum ClientEventListenerType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Guild,
  AuditLog,
  Global,
}

type PayloadProcessor<TEventName extends keyof ClientEvents, TReturnType> = (
  ...payload: ClientEvents[TEventName]
) => TReturnType;

export type PayloadToGuildResolver<TEventName extends keyof ClientEvents> = PayloadProcessor<
  TEventName,
  Guild | undefined
>;

export type PayloadToInvolvedChannelResolver<TEventName extends keyof ClientEvents> =
  PayloadProcessor<TEventName, Snowflake[]>;

export type PayloadToAuditLogMatchFilterResolver<TEventName extends keyof ClientEvents> =
  PayloadProcessor<TEventName, AuditLogMatchFilter | undefined>;

export type GlobalEventGuildRelevanceFilter<TEventName extends keyof ClientEvents> = (
  guild: Guild,
  ...payload: ClientEvents[TEventName]
) => Promise<boolean>;

interface BaseClientEventListenerDefinition<TType extends ClientEventListenerType> {
  type: TType;
}

interface BaseGuildClientEventListenerDefinition<
  TEventName extends keyof ClientEvents,
  TType extends ClientEventListenerType
> extends BaseClientEventListenerDefinition<TType> {
  guildResolver: PayloadToGuildResolver<TEventName>;
  channelResolver?: PayloadToInvolvedChannelResolver<TEventName>;
}

export type GuildClientEventListenerDefinition<TEventName extends keyof ClientEvents> =
  BaseGuildClientEventListenerDefinition<TEventName, ClientEventListenerType.Guild>;

export interface AuditLogClientEventListenerDefinition<TEventName extends keyof ClientEvents>
  extends BaseGuildClientEventListenerDefinition<TEventName, ClientEventListenerType.AuditLog> {
  filterResolver: PayloadToAuditLogMatchFilterResolver<TEventName>;
}

export interface GlobalClientEventListenerDefinition<TEventName extends keyof ClientEvents>
  extends BaseClientEventListenerDefinition<ClientEventListenerType.Global> {
  relevanceFilter: GlobalEventGuildRelevanceFilter<TEventName>;
}

export type ClientEventListenerDefinition<TEventName extends keyof ClientEvents> =
  | GuildClientEventListenerDefinition<TEventName>
  | AuditLogClientEventListenerDefinition<TEventName>
  | GlobalClientEventListenerDefinition<TEventName>;

export function createClientEventListener<TEventName extends MegalogSupportedClientEvent>(
  client: Client,
  logger: Logger,
  subscriptionManager: MegalogSubscriptionManager,
  eventTypeManager: MegalogEventTypeManager,
  ignoreManager: MegalogIgnoreManager,
  auditLogMatcher: AuditLogMatcher,
  eventName: TEventName,
  definition: ClientEventListenerDefinition<TEventName>
): Subscription {
  const eventTypes = eventTypeManager.getClientListeners(eventName);
  if (eventTypes.length === 0) return Subscription.EMPTY;
  const eventStream = fromClientEvent(client, eventName);
  switch (definition.type) {
    case ClientEventListenerType.Guild:
    case ClientEventListenerType.AuditLog:
      return eventStream
        .pipe(
          concatMap(payload =>
            of(definition.guildResolver(...payload)).pipe(
              filterNullAndUndefined(),
              takeIfNotIgnored(ignoreManager, payload, definition.channelResolver),
              mergeMap(guild => {
                const stream = from(eventTypes).pipe(
                  withChannelProcessor(logger, payload),
                  concatMap(({type, channelProcessor}) =>
                    of(subscriptionManager.getSubscribedChannel(type, guild)).pipe(
                      filterNullAndUndefined(),
                      processChannel(logger, channelProcessor)
                    )
                  )
                );
                if (definition.type !== ClientEventListenerType.AuditLog) return stream;
                return stream.pipe(
                  toArray(),
                  filter(processors => processors.length > 0),
                  wrapToAuditLogListener(logger),
                  mergeMap(listener =>
                    of(definition.filterResolver(...payload)).pipe(
                      filterNullAndUndefined(),
                      map(matchFilter => auditLogMatcher.requestMatch(guild, listener, matchFilter))
                    )
                  )
                );
              })
            )
          )
        )
        .subscribe();
    case ClientEventListenerType.Global:
      return eventStream
        .pipe(
          concatMap(payload =>
            from(eventTypes).pipe(
              filter(type => subscriptionManager.hasSubscribers(type)),
              withChannelProcessor(logger, payload),
              concatMap(({type, channelProcessor}) =>
                from(subscriptionManager.getSubscribedChannels(type) ?? EMPTY).pipe(
                  concatMap(channel =>
                    from(definition.relevanceFilter(channel.guild, ...payload)).pipe(
                      takeWhile(relevant => relevant),
                      map(() => channel)
                    )
                  ),
                  processChannel(logger, channelProcessor)
                )
              )
            )
          )
        )
        .subscribe();
    default:
      // @ts-expect-error incase this code is executed, "type" must be something invalid
      throw new Error(`Unknown client event listener type: ${definition.type}`);
  }
}
