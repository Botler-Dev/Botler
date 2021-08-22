import {
  DatabaseEventHub,
  getTableDeleteStream,
  getTableInsertStream,
  ModelManager,
} from '@/database';
import {MegalogIgnoreChannel, Prisma, PrismaClient} from '@prisma/client';
import {Client, Collection, GuildChannel, GuildResolvable, Snowflake} from 'discord.js';
import {from, merge} from 'rxjs';
import {injectable} from 'tsyringe';

export type MegalogGuildIgnoredChannels = Set<Snowflake>;

@injectable()
export class MegalogIgnoreManager extends ModelManager<PrismaClient['megalogIgnoreChannel']> {
  /**
   * Cached collection of guilds with the respective {@link MegalogGuildIgnoredChannels}.
   */
  private readonly cache = new Collection<Snowflake, MegalogGuildIgnoredChannels>();

  private readonly client: Client;

  private readonly eventHub: DatabaseEventHub;

  constructor(client: Client, prisma: PrismaClient, eventHub: DatabaseEventHub) {
    super(prisma.megalogIgnoreChannel);
    this.client = client;
    this.eventHub = eventHub;
  }

  async initialize(): Promise<void> {
    merge(
      from(await this.model.findMany()),
      await getTableInsertStream<MegalogIgnoreChannel>(
        this.eventHub,
        Prisma.ModelName.MegalogIgnoreChannel
      )
    ).subscribe(({guildId, channelId}) => this.addCacheEntry(guildId, channelId));
    (
      await getTableDeleteStream<MegalogIgnoreChannel>(
        this.eventHub,
        Prisma.ModelName.MegalogIgnoreChannel
      )
    ).subscribe(({guildId, channelId}) => this.removeCacheEntry(guildId, channelId));
  }

  private addCacheEntry(guildId: string, channelId: string): void {
    let channels = this.cache.get(guildId);
    if (!channels) {
      channels = new Set();
      this.cache.set(guildId, channels);
    }
    channels.add(channelId);
  }

  private removeCacheEntry(guildId: string, channelId: string): void {
    this.cache.get(guildId)?.delete(channelId);
  }

  async ignore(channel: GuildChannel): Promise<void> {
    await this.model.upsert({
      update: {},
      create: {
        guildId: channel.guild.id,
        channelId: channel.id,
      },
      where: {
        guildId_channelId: {
          guildId: channel.guild.id,
          channelId: channel.id,
        },
      },
    });
    this.addCacheEntry(channel.guild.id, channel.id);
  }

  async unignore(channelId: Snowflake, guildId: string): Promise<void> {
    await this.model.delete({where: {guildId_channelId: {channelId, guildId}}});
    this.removeCacheEntry(guildId, channelId);
  }

  isIgnored(channel: GuildChannel): boolean {
    return !!this.cache.get(channel.guild.id)?.has(channel.id);
  }

  getIgnoredChannelIds(guildId: Snowflake): Snowflake[] {
    return [...(this.cache.get(guildId)?.values() ?? [])];
  }

  getIgnoredChannels(guild: GuildResolvable): GuildChannel[] {
    const guildObject = this.client.guilds.resolve(guild);
    if (!guildObject) return [];
    return this.getIgnoredChannelIds(guildObject.id)
      .map(channelId => guildObject.channels.cache.get(channelId))
      .filter((channel): channel is NonNullable<typeof channel> => !!channel);
  }
}
