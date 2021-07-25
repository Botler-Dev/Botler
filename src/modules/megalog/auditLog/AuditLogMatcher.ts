import {Logger, MasterLogger} from '@/logger';
import {Guild, GuildAuditLogsAction, GuildAuditLogsEntry, Snowflake} from 'discord.js';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {injectable} from 'tsyringe';
import {MegalogSettingsWrapper} from '../settings/MegalogSettingsWrapper';
import {AuditLogMatchQueue} from './AuditLogMatchQueue';

/**
 * Match listener that is called once a matching {@link GuildAuditLogsEntry} is found.
 */
export type AuditLogMatchListener = (entry: GuildAuditLogsEntry) => void;

/**
 * Checker for if a {@link GuildAuditLogsEntry} is a match.
 * {@link entry} will always match the rest of the {@link AuditLogMatchFilter} criteria.
 */
export type AuditLogMatchChecker = (entry: GuildAuditLogsEntry) => boolean;

/**
 * Match criteria for {@link AuditLogMatchFilter}.
 */
export interface AuditLogMatchFilter {
  /**
   * ID of user that executed the action.
   */
  executor?: Snowflake;
  /**
   * Action that was executed.
   */
  action?: GuildAuditLogsAction;
  checker?: AuditLogMatchChecker;
}

/**
 * Singleton class that takes {@link GuildAuditLogsEntry} match requests and manages their resolution.
 */
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

  /**
   * Add a {@link GuildAuditLogsEntry} match request.
   * Drops the request immediately if the bot does not have the `VIEW_AUDIT_LOG` permission in the guild.
   */
  requestMatch(
    guild: Guild,
    listener: AuditLogMatchListener,
    filter: AuditLogMatchFilter = {}
  ): boolean {
    if (!guild.me?.hasPermission('VIEW_AUDIT_LOG')) return false;
    this.getGuildQueue(guild).addEntry(listener, filter);
    return true;
  }

  /**
   * Try to resolve all match requests.
   */
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
