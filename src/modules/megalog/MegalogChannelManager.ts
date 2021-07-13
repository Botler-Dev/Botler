import {DatabaseEventHub, ModelManager} from '@/database';
import {getTableDeleteStream, getTableNonDeleteStream} from '@/database/synchronizer/changeStreams';
import {MegalogLogChannel, Prisma, PrismaClient} from '@prisma/client';
import {Client, Collection, Guild, Snowflake, TextChannel} from 'discord.js';
import {from, merge} from 'rxjs';
import {injectable} from 'tsyringe';
import {MegalogEventTypeManager} from './eventType/MegalogEventTypeManager';
import type {MegalogEventName} from './MegalogModule';

/**
 * Channels subscribed to an event.
 * Maps guild ID to channel ID.
 */
type EventChannels = Collection<Snowflake, Snowflake>;

type DeletedMegalogLogChannel = Pick<MegalogLogChannel, 'eventName' | 'guildId'>;

@injectable()
export class MegalogChannelManager extends ModelManager<PrismaClient['megalogLogChannel']> {
  /**
   * Maps {@link MegalogEventName} to all guilds that have a log channel set for that event.
   */
  private readonly cache = new Map<MegalogEventName, EventChannels>();

  private readonly client: Client;

  private readonly eventHub: DatabaseEventHub;

  private readonly eventTypeManager: MegalogEventTypeManager;

  constructor(
    client: Client,
    prisma: PrismaClient,
    eventHub: DatabaseEventHub,
    eventTypeManager: MegalogEventTypeManager
  ) {
    super(prisma.megalogLogChannel);
    this.client = client;
    this.eventHub = eventHub;
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

  private updateCacheEntry(eventName: MegalogEventName, guildId: Snowflake, channelId: Snowflake) {
    let channels = this.cache.get(eventName);
    if (!channels) {
      channels = new Collection();
      this.cache.set(eventName, channels);
    }
    channels.set(guildId, channelId);
  }

  private deleteCacheEntry(eventName: MegalogEventName, guildId: Snowflake) {
    this.cache.get(eventName)?.delete(guildId);
  }

  async assignLogChannel(eventName: MegalogEventName, channel: TextChannel): Promise<void> {
    this.eventTypeManager.checkEventTypeName(eventName);
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

  async unassignLogChannel(eventName: MegalogEventName, guild: Guild): Promise<void> {
    this.eventTypeManager.checkEventTypeName(eventName);
    await this.model.delete({
      where: {
        eventName_guildId: {
          eventName,
          guildId: guild.id,
        },
      },
    });
    this.deleteCacheEntry(eventName, guild.id);
  }

  getLogChannels(eventName: MegalogEventName): TextChannel[] | undefined {
    this.eventTypeManager.checkEventTypeName(eventName);
    return this.cache
      .get(eventName)
      ?.map((channelId, guildId) =>
        this.client.guilds.cache.get(guildId)?.channels.cache.get(channelId)
      )
      .filter((channel): channel is TextChannel => channel instanceof TextChannel);
  }

  getLogChannel(eventName: MegalogEventName, guild: Guild): TextChannel | undefined {
    this.eventTypeManager.checkEventTypeName(eventName);
    const channelId = this.cache.get(eventName)?.get(guild.id);
    if (!channelId) return undefined;
    const channel = guild.channels.cache.get(channelId);
    // TODO: remove channel entry if invalid
    if (!(channel instanceof TextChannel)) return undefined;
    return channel;
  }
}
