import {Logger, MasterLogger} from '@/logger';
import {Duration} from 'dayjs/plugin/duration';
import {Collection, Guild, GuildAuditLogsAction, GuildAuditLogsEntry, Snowflake} from 'discord.js';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {injectable} from 'tsyringe';
import {MegalogSettingsWrapper} from '../settings/MegalogSettingsWrapper';
import {AuditLogMatchQueue} from './AuditLogMatchQueue';

export type AuditLogMatchListener = (entry: GuildAuditLogsEntry) => void;

export interface AuditLogMatchFilter {
  executor?: Snowflake;
  action?: GuildAuditLogsAction;
  checker?: (entry: GuildAuditLogsEntry) => boolean;
}

@injectable()
export class AuditLogMatcher {
  private readonly guildQueues = new Collection<Snowflake, AuditLogMatchQueue>();

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

  private updateInterval(interval: Duration) {
    if (this.interval) clearInterval(this.interval);
    this.logger.info(`Set try-matching interval to ${interval.asMilliseconds()}ms.`);
    this.interval = setInterval(() => this.tryMatching(), interval.asMilliseconds());
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
    return false;
  }

  async tryMatching(): Promise<void> {
    const totalGuildsBefore = this.guildQueues.size;
    const totalQueueLengthBefore = this.guildQueues
      .map(queue => queue.length)
      // eslint-disable-next-line unicorn/no-array-reduce
      .reduce((acc, value) => value + acc, 0);

    const guilds = [...this.guildQueues.values()];
    const results = await Promise.all(guilds.map(queue => queue.tryMatch()));

    const failedCount = results
      .map((result, index) => (result === undefined ? index : undefined))
      .filter((index): index is NonNullable<typeof index> => index !== undefined)
      .map(index => this.guildQueues.delete(guilds[index].guild.id)).length;

    // eslint-disable-next-line unicorn/no-array-reduce
    const matchCount = results.reduce<number>((acc, value = 0) => value + acc, 0);

    this.logger.log(
      `Executed and matched ${matchCount}/${totalQueueLengthBefore} entries. ${failedCount}/${totalGuildsBefore} guild queue${
        failedCount !== 1 ? 's' : ''
      } failed.`
    );
  }
}
