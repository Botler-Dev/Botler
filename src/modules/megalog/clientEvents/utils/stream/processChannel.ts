import {Logger} from '@/logger';
import {
  MegalogAuditLogEntryProcessor,
  MegalogChannelProcessor,
} from '@/modules/megalog/eventType/MegalogEventType';
import {TextChannel} from 'discord.js';
import {from, OperatorFunction} from 'rxjs';
import {catchError, concatMap, filter} from 'rxjs/operators';
import type {MegalogSupportedAuditLogClientEvent, MegalogSupportedClientEvent} from '../..';

export function processChannel<TEventName extends MegalogSupportedClientEvent>(
  logger: Logger,
  channelProcessor: MegalogChannelProcessor<TEventName>
): OperatorFunction<TextChannel, MegalogAuditLogEntryProcessor> {
  return source =>
    source.pipe(
      concatMap(channel =>
        from(channelProcessor(channel)).pipe(
          catchError(async error =>
            logger.error(`Encountered error while executing a MegalogChannelProcessor.`, error)
          ),
          filter(
            (
              entryProcessor
            ): entryProcessor is TEventName extends MegalogSupportedAuditLogClientEvent
              ? MegalogAuditLogEntryProcessor
              : never => !!entryProcessor
          )
        )
      )
    );
}
