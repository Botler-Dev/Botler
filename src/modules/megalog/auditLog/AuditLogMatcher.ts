import {Logger, MasterLogger} from '@/logger';
import {Guild, GuildAuditLogsAction, GuildAuditLogsEntry, Snowflake} from 'discord.js';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {injectable} from 'tsyringe';
import {MegalogSettingsWrapper} from '../settings/MegalogSettingsWrapper';
import {AuditLogMatchQueue} from './AuditLogMatchQueue';

export type AuditLogMatchListener = (entry: GuildAuditLogsEntry) => void;

export type AuditLogMatchChecker = (entry: GuildAuditLogsEntry) => boolean;

export interface AuditLogMatchFilter {
  executor?: Snowflake;
  action?: GuildAuditLogsAction;
  checker?: AuditLogMatchChecker;
}

@injectable()
export class AuditLogMatcher {
  private readonly guildQueues = new Map<Snowflake, AuditLogMatchQueue>();

  private interval!: NodeJS.Timeout;

  private readonly logger: Logger;

  private readonly megalogSettings: MegalogSettingsWrapper;

  constructor(megalogSettings: MegalogSettingsWrapper, masterLogger: MasterLogger) {
    this.megalogSettings = megalogSettings;
    this.logger = masterLogger.getScope('audit-log matcher');
    megalogSettings.afterEntityChangeWithInitial
      .pipe(
        map(() => megalogSettings.auditLogMatchTryInterval),
        distinctUntilChanged()
      )
      .subscribe(interval => this.updateInterval(interval));
  }

  private updateInterval(intervalMilliseconds: number) {
    if (this.interval) clearInterval(this.interval);
    this.logger.info(`Set try-matching interval to ${intervalMilliseconds}ms.`);
    this.interval = setInterval(() => this.tryMatching(), intervalMilliseconds);
  }

  private getGuildQueue(guild: Guild): AuditLogMatchQueue {
    let guildQueue = this.guildQueues.get(guild.id);
    if (!guildQueue) {
      guildQueue = new AuditLogMatchQueue(this.megalogSettings, guild);
      this.guildQueues.set(guild.id, guildQueue);
    }
    return guildQueue;
  }

  requestMatch(
    guild: Guild,
    listener: AuditLogMatchListener,
    filter: AuditLogMatchFilter = {}
  ): boolean {
    if (!guild.me?.hasPermission('VIEW_AUDIT_LOG')) return false;
    this.getGuildQueue(guild).addEntry(listener, filter);
    return true;
  }

  async tryMatching(): Promise<void> {
    const queues = [...this.guildQueues.values()].filter(queue => queue.length > 0);
    if (queues.length === 0) return;
    const results = await Promise.all(queues.map(queue => queue.tryMatch()));
    results.forEach((count, index) => {
      if (count !== undefined) return;
      this.guildQueues.delete(queues[index].guild.id);
    });
  }
}
