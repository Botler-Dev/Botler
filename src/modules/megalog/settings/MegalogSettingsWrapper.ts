import {SynchronizedEntityWrapper} from '@/database';
import {MegalogSettings} from '@prisma/client';
import dayjs from 'dayjs';
import {Duration} from 'dayjs/plugin/duration';

export class MegalogSettingsWrapper extends SynchronizedEntityWrapper<MegalogSettings | undefined> {
  get version(): number | undefined {
    return this.entity?.version;
  }

  get auditLogMatchTryInterval(): Duration {
    return dayjs.duration(this.entity?.auditLogMatchTryInterval ?? 1000);
  }

  get auditLogFetchSize(): number {
    return this.entity?.auditLogFetchSize ?? 50;
  }

  get maxAuditLogMatchQueueLength(): number {
    return this.entity?.maxAuditLogMatchQueueLength ?? 100;
  }

  get maxAuditLogMatchTries(): number {
    return this.entity?.maxAuditLogMatchTries ?? 10;
  }
}
