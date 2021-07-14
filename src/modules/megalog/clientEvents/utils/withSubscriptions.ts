import {Guild, TextChannel} from 'discord.js';
import {from, of, OperatorFunction} from 'rxjs';
import {concatMap, filter, map, mergeMap, toArray} from 'rxjs/operators';
import type {MegalogSupportedClientEvent} from '..';
import {MegalogEventType} from '../../eventType/MegalogEventType';
import {MegalogChannelManager} from '../../MegalogChannelManager';

export interface MegalogGuildSubscriptions<TEventName extends MegalogSupportedClientEvent> {
  guild: Guild;
  subscriptions: MegalogSubscription<TEventName>[];
}

export interface MegalogSubscription<TEventName extends MegalogSupportedClientEvent> {
  type: MegalogEventType<TEventName>;
  channel: TextChannel;
}

export function withSubscriptions<TEventName extends MegalogSupportedClientEvent>(
  channelManager: MegalogChannelManager,
  eventTypes: ReadonlyArray<MegalogEventType<TEventName>>
): OperatorFunction<Guild, MegalogGuildSubscriptions<TEventName>> {
  return source =>
    source.pipe(
      concatMap(guild =>
        from(eventTypes).pipe(
          mergeMap(type =>
            of(channelManager.getLogChannel(type.name, guild)).pipe(
              filter((channel): channel is NonNullable<typeof channel> => !!channel),
              map(channel => ({type, channel}))
            )
          ),
          toArray(),
          map(subscriptions => ({guild, subscriptions}))
        )
      )
    );
}
