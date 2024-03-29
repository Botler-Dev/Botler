import {Logger} from '@/logger';
import {
  MegalogChannelProcessor,
  MegalogEventType,
} from '@/modules/megalog/eventType/MegalogEventType';
import {ClientEvents} from 'discord.js';
import {from, OperatorFunction} from 'rxjs';
import {catchError, concatMap, filter, map} from 'rxjs/operators';
import type {MegalogSupportedClientEvent} from '../..';

export interface MegalogEventTypeChannelProcessorPair<
  TEventName extends MegalogSupportedClientEvent
> {
  type: MegalogEventType<TEventName>;
  channelProcessor: MegalogChannelProcessor<TEventName>;
}

export function withChannelProcessor<TEventName extends MegalogSupportedClientEvent>(
  logger: Logger,
  payload: ClientEvents[TEventName]
): OperatorFunction<
  MegalogEventType<TEventName>,
  MegalogEventTypeChannelProcessorPair<TEventName>
> {
  return source =>
    source.pipe(
      concatMap(type =>
        from(type.processClientEvent(...payload)).pipe(
          catchError(async error =>
            logger.error(
              `MegalogEventType "${type.name}" threw an error while processing a client event.`,
              error
            )
          ),
          filter(
            (
              channelProcessor
            ): channelProcessor is Exclude<typeof channelProcessor, void | undefined> =>
              !!channelProcessor
          ),
          map(channelProcessor => ({type, channelProcessor}))
        )
      )
    );
}
