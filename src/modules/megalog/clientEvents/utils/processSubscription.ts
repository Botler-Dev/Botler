import {Logger} from '@/logger';
import {ExportProxyClientEvents} from 'discord.js';
import {of, OperatorFunction} from 'rxjs';
import {catchError, concatMap, filter, mergeMap} from 'rxjs/operators';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '..';
import {MegalogAuditLogEntryProcessor} from '../../eventType/MegalogEventType';
import {MegalogSubscription} from './withSubscriptions';

export function processSubscription<TEventName extends MegalogSupportedClientEvent>(
  logger: Logger,
  payload: ExportProxyClientEvents[TEventName]
): OperatorFunction<MegalogSubscription<TEventName>, MegalogAuditLogEntryProcessor> {
  return source =>
    source.pipe(
      concatMap(({channel, type}) =>
        of(type).pipe(
          mergeMap(tempType => tempType.processClientEvent(channel, ...payload)),
          catchError(async error =>
            logger.error(
              `Event type ${type.name} threw an error while processing a client event.`,
              error
            )
          ),
          filter(
            (
              callback
            ): callback is TEventName extends AuditLogSupportedClientEvent
              ? MegalogAuditLogEntryProcessor
              : never => !!callback
          )
        )
      )
    );
}
