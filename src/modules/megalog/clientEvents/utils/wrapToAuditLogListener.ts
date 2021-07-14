import {Logger} from '@/logger';
import {from, lastValueFrom, OperatorFunction} from 'rxjs';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {AuditLogMatchListener} from '../../auditLog/AuditLogMatcher';
import {MegalogAuditLogEntryProcessor} from '../../eventType/MegalogEventType';

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
                  logger.error(`An audit log callback threw an error.`, error)
                )
              )
            )
      )
    );
}
