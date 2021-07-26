import {SynchronizedEntityWrapper} from '@/database';
import {MegalogSettings} from '@prisma/client';

/**
 * {@link SynchronizedEntityWrapper} for the {@link MegalogSettings}.
 */
export class MegalogSettingsWrapper extends SynchronizedEntityWrapper<MegalogSettings | undefined> {
  /**
   * Version of the {@link MegalogSettings} being used.
   * Always the highest in the table or `undefined` if non exists.
   */
  get version(): number | undefined {
    return this.entity?.version;
  }

  /**
   * Interval in milliseconds in which the {@link AuditLogMatcher} tries to resolve match requests.
   */
  get auditLogMatchTryInterval(): number {
    return this.entity?.auditLogMatchTryInterval ?? 1000;
  }

  /**
   * How many audit log entries get fetched per guild on one match try.
   */
  get auditLogFetchSize(): number {
    return this.entity?.auditLogFetchSize ?? 10;
  }

  /**
   * Maximum amount of match requests stored per guild.
   */
  get maxAuditLogMatchQueueLength(): number {
    return this.entity?.maxAuditLogMatchQueueLength ?? 100;
  }

  /**
   * Maximum amount of times a match request will be included in the match tries before being dropped.
   */
  get maxAuditLogMatchTries(): number {
    return this.entity?.maxAuditLogMatchTries ?? 10;
  }
}
