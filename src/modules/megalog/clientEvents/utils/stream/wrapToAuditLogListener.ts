import {Logger} from '@/logger';
import {AuditLogMatchListener} from '@/modules/megalog/auditLog/AuditLogMatcher';
import {MegalogAuditLogEntryProcessor} from '@/modules/megalog/eventType/MegalogEventType';
import {from, lastValueFrom, OperatorFunction} from 'rxjs';
import {catchError, map, mergeMap} from 'rxjs/operators';
/**
 * Wraps the array of incoming {@link MegalogAuditLogEntryProcessor} into an {@link AuditLogMatchListener}
 */
export function wrapToAuditLogListener(
  logger: Logger
): OperatorFunction<MegalogAuditLogEntryProcessor[], AuditLogMatchListener> {
  return source =>
    source.pipe(
      map(
        (callbacks): AuditLogMatchListener =>
          entry =>
            lastValueFrom(
              from(callbacks).pipe(
                mergeMap(callback => callback(entry)),
                catchError(async error =>
                  logger.error(
                    `Encountered an error while executing a MegalogAuditLogEntryProcessor.`,
                    error
                  )
                )
              )
            )
      )
    );
}
