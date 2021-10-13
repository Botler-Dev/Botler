import {SettingsWrapper} from '@/database';
import {MegalogSettings} from '@prisma/client';

export class MegalogSettingsWrapper extends SettingsWrapper<MegalogSettings> {
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

  get guildAttachCondensedJsonDefault(): boolean {
    return this.entity?.guildAttachCondensedJsonDefault ?? true;
  }

  get guildShowCondensedPreviewDefault(): boolean {
    return this.entity?.guildShowCondensedPreviewDefault ?? false;
  }
}
