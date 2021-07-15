import dayjs from 'dayjs';
import {
  Guild,
  GuildAuditLogsAction,
  GuildAuditLogsActions,
  GuildAuditLogsEntry,
  Snowflake,
} from 'discord.js';
import {MegalogSettingsWrapper} from '../settings/MegalogSettingsWrapper';
import type {AuditLogMatchFilter, AuditLogMatchListener} from './AuditLogMatcher';

interface QueueEntry {
  listener: AuditLogMatchListener;
  tryAge: number;
  filter: AuditLogMatchFilter;
}

interface CumulativeQueryCache {
  user?: string;
  type?: keyof GuildAuditLogsActions;
}

export class AuditLogMatchQueue {
  readonly guild: Guild;

  private readonly entires: QueueEntry[] = [];

  private readonly megalogSettings: MegalogSettingsWrapper;

  private lastFetchedEntryTimestamp = 0;

  private cumulativeQueryCache?: CumulativeQueryCache;

  get length(): number {
    return this.entires.length;
  }

  constructor(megalogSettings: MegalogSettingsWrapper, guild: Guild) {
    this.guild = guild;
    this.megalogSettings = megalogSettings;
  }

  addEntry(listener: AuditLogMatchListener, filter: AuditLogMatchFilter): void {
    if (this.entires.length >= this.megalogSettings.maxAuditLogMatchQueueLength)
      this.entires.splice(
        0,
        this.entires.length - this.megalogSettings.maxAuditLogMatchQueueLength + 1
      );
    this.entires.push({
      listener,
      tryAge: 0,
      filter,
    });
    this.cumulativeQueryCache = undefined;
  }

  private getCumulativeQuery() {
    if (this.cumulativeQueryCache) return this.cumulativeQueryCache;

    const lastEntry = this.entires[this.entires.length - 1];
    const allExecutorsSame = this.entires.every(
      entry => entry.filter.executor === lastEntry.filter.executor
    );
    const allTypesSame = this.entires.every(
      entry => entry.filter.action === lastEntry.filter.action
    );
    const cumulativeQuery = {
      user: allExecutorsSame ? lastEntry.filter.executor : undefined,
      type: allTypesSame ? lastEntry.filter.action : undefined,
    };

    this.cumulativeQueryCache = cumulativeQuery;
    return cumulativeQuery;
  }

  private async fetchNewAuditLogEntries(user?: Snowflake, type?: GuildAuditLogsAction) {
    const fetchTimestamp = dayjs().unix();

    let entries: GuildAuditLogsEntry[];
    try {
      const auditLogs = await this.guild.fetchAuditLogs({
        user,
        type,
        limit: this.megalogSettings.auditLogFetchSize,
      });
      entries = auditLogs.entries.array();
    } catch {
      return undefined;
    }

    const firstNewEntryIndex = entries
      .reverse()
      .findIndex(entry => entry.createdTimestamp > this.lastFetchedEntryTimestamp);
    // Add a small time buffer to account for late arriving and late firing client events.
    this.lastFetchedEntryTimestamp = fetchTimestamp - this.guild.client.ws.ping - 500;

    return firstNewEntryIndex === -1 ? [] : entries.slice(entries.length - firstNewEntryIndex - 1);
  }

  private static doesAuditLogEntryPassFilter(
    entry: GuildAuditLogsEntry,
    filter: AuditLogMatchFilter
  ) {
    return (
      (filter.action === undefined || entry.action === filter.action) &&
      (!filter.executor || entry.executor.id === filter.executor) &&
      (!filter.checker || filter.checker(entry))
    );
  }

  async tryMatch(): Promise<number | undefined> {
    if (this.entires.length === 0) return 0;
    const query = this.getCumulativeQuery();
    const auditLogEntries = await this.fetchNewAuditLogEntries(query.user, query.type);
    if (auditLogEntries === undefined) return undefined;
    if (auditLogEntries.length === 0) return 0;

    const queueLengthBefore = this.entires.length;
    this.entires.forEach((queueEntry, queueIndex) => {
      const auditLogEntry = auditLogEntries.find(entry =>
        AuditLogMatchQueue.doesAuditLogEntryPassFilter(entry, queueEntry.filter)
      );
      // eslint-disable-next-line no-param-reassign
      queueEntry.tryAge += 1;
      if (auditLogEntry || queueEntry.tryAge >= this.megalogSettings.maxAuditLogMatchTries)
        this.entires.splice(queueIndex, 1);
      if (!auditLogEntry) return;
      queueEntry.listener(auditLogEntry);
    });
    return queueLengthBefore - this.entires.length;
  }
}
