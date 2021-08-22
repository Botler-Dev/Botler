import {DatabaseEventHub, ModelManager} from '@/database';
import {getTableDeleteStream, getTableNonDeleteStream} from '@/database';
import {Logger} from '@/logger';
import {resolveTextBasedChannelId} from '@/utils/resolve';
import {MegalogLogChannel, Prisma, PrismaClient} from '@prisma/client';
import {
  Client,
  Collection,
  Guild,
  Snowflake,
  TextBasedChannelResolvable,
  TextChannel,
} from 'discord.js';
import {from, merge} from 'rxjs';
import {injectable} from 'tsyringe';
import {MegalogEventTypeName, MegalogEventTypeResolvable} from './eventType/MegalogEventType';
import {MegalogEventTypeManager} from './eventType/MegalogEventTypeManager';

/**
 * Channels subscribed to an event.
 * Maps guild ID to channel ID.
 */
type EventChannels = Collection<Snowflake, Snowflake>;

type DeletedMegalogLogChannel = Pick<MegalogLogChannel, 'eventName' | 'guildId'>;

/**
 * Singleton class that manages and caches all megalog subscriptions.
 */
@injectable()
export class MegalogChannelManager extends ModelManager<PrismaClient['megalogLogChannel']> {
  /**
   * Maps {@link MegalogEventTypeName} to all guilds that have a log channel set for that event.
   */
  private readonly cache = new Map<MegalogEventTypeName, EventChannels>();

  /**
   * Number of events have been assigned to a certain {@link TextChannel}.
   */
  private readonly channelSubscriptionCounts = new Map<Snowflake, number>();

  private readonly logger: Logger;

  private readonly eventTypeManager: MegalogEventTypeManager;

  private readonly client: Client;

  private readonly eventHub: DatabaseEventHub;

  constructor(
    client: Client,
    prisma: PrismaClient,
    eventHub: DatabaseEventHub,
    logger: Logger,
    eventTypeManager: MegalogEventTypeManager
  ) {
    super(prisma.megalogLogChannel);
    this.client = client;
    this.eventHub = eventHub;
    this.logger = logger;
    this.eventTypeManager = eventTypeManager;
  }

  async initialize(): Promise<void> {
    merge(
      from(await this.model.findMany()),
      await getTableNonDeleteStream<MegalogLogChannel>(
        this.eventHub,
        Prisma.ModelName.MegalogLogChannel
      )
    ).subscribe(({eventName, guildId, channelId}) =>
      this.updateCacheEntry(eventName, guildId, channelId)
    );
    (
      await getTableDeleteStream<DeletedMegalogLogChannel>(
        this.eventHub,
        Prisma.ModelName.MegalogLogChannel
      )
    ).subscribe(({eventName, guildId}) => this.deleteCacheEntry(eventName, guildId));
  }

  private updateCacheEntry(
    eventName: MegalogEventTypeName,
    guildId: Snowflake,
    channelId: Snowflake
  ) {
    let channels = this.cache.get(eventName);
    if (!channels) {
      channels = new Collection();
      this.cache.set(eventName, channels);
    } else {
      const previousChannelId = channels.get(guildId);
      if (previousChannelId) this.subtractChannelSubscription(previousChannelId);
    }
    channels.set(guildId, channelId);
    this.addChannelSubscription(channelId);
  }

  private deleteCacheEntry(eventName: MegalogEventTypeName, guildId: Snowflake) {
    const channels = this.cache.get(eventName);
    if (!channels) return;
    const channelId = channels.get(guildId);
    if (!channelId) return;
    this.subtractChannelSubscription(channelId);
    channels.delete(guildId);
  }

  private addChannelSubscription(channelId: Snowflake) {
    this.channelSubscriptionCounts.set(
      channelId,
      (this.channelSubscriptionCounts.get(channelId) ?? 0) + 1
    );
  }

  private subtractChannelSubscription(channelId: Snowflake) {
    const channelOccupancy = this.channelSubscriptionCounts.get(channelId);
    if (!channelOccupancy) this.channelSubscriptionCounts.delete(channelId);
    else this.channelSubscriptionCounts.set(channelId, channelOccupancy - 1);
  }

  /**
   * Create or reassign a guild subscription.
   */
  async assignLogChannel(
    eventType: MegalogEventTypeResolvable,
    channel: TextChannel
  ): Promise<void> {
    const eventName = this.eventTypeManager.resolveCheckedName(eventType);
    await this.model.upsert({
      update: {
        channelId: channel.id,
      },
      create: {
        eventName,
        guildId: channel.guild.id,
        channelId: channel.id,
      },
      where: {
        eventName_guildId: {
          eventName,
          guildId: channel.guild.id,
        },
      },
    });
    this.updateCacheEntry(eventName, channel.guild.id, channel.id);
  }

  /**
   * Delete a guild subscription if it exists.
   */
  async unassignLogChannel(
    eventType: MegalogEventTypeResolvable,
    guildId: Snowflake
  ): Promise<void> {
    const eventName = this.eventTypeManager.resolveCheckedName(eventType);
    await this.model.delete({where: {eventName_guildId: {eventName, guildId}}});
    this.deleteCacheEntry(eventName, guildId);
  }

  /**
   * If a certain {@link MegalogEventType} has any subscriptions.
   */
  hasChannels(eventType: MegalogEventTypeResolvable): boolean {
    return (this.cache.get(this.eventTypeManager.resolveName(eventType))?.size ?? 0) > 0;
  }

  /**
   * Get all {@link TextChannel}s that are subscribed to a certain {@link MegalogEventType}.
   */
  getChannels(eventType: MegalogEventTypeResolvable): TextChannel[] | undefined {
    const eventName = this.eventTypeManager.resolveName(eventType);
    return this.cache
      .get(eventName)
      ?.map((channelId, guildId) =>
        this.client.guilds.cache.get(guildId)?.channels.cache.get(channelId)
      )
      .filter((channel): channel is TextChannel => channel instanceof TextChannel);
  }

  /**
   * Get the {@link TextChannel} of a certain guild that is subscribed to a certain {@link MegalogEventType} if one exists.
   */
  getChannel(eventType: MegalogEventTypeResolvable, guild: Guild): TextChannel | undefined {
    const eventName = this.eventTypeManager.resolveName(eventType);
    const channelId = this.cache.get(eventName)?.get(guild.id);
    if (!channelId) return undefined;
    const channel = guild.channels.cache.get(channelId);
    if (!(channel instanceof TextChannel)) {
      this.unassignLogChannel(eventType, guild.id).catch(error =>
        this.logger.error(`Encountered error while trying to unassign invalid channel.`, error)
      );
      return undefined;
    }
    return channel;
  }

  /**
   * Fast check if the provided {@link TextBasedChannelResolvable} as any events assigned to it.
   */
  channelHasSubscriptions(channel: TextBasedChannelResolvable): boolean {
    const id = resolveTextBasedChannelId(channel);
    return !!this.channelSubscriptionCounts.get(id);
  }
}
