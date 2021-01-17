import {Snowflake, GuildManager as DiscordGuildManager, Client} from 'discord.js';
import {container} from 'tsyringe';
import {Connection} from 'typeorm';
import GuildEntity from '../entities/GuildEntity';
import CacheManager from '../manager/CacheManager';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';
import GuildMemberWrapper from '../wrappers/GuildMemberWrapper';
import GuildWrapper, {GuildWrapperResolvable} from '../wrappers/GuildWrapper';

export default class GuildManager extends CacheManager<
  GuildEntity,
  GuildWrapper,
  Snowflake,
  GuildManager
> {
  private readonly discordGuilds: DiscordGuildManager;

  private readonly synchronizer: CacheSynchronizer<GuildEntity, 'id', Snowflake>;

  constructor(connection?: Connection, {guilds} = container.resolve(Client)) {
    super(GuildEntity, connection);
    this.discordGuilds = guilds;
    this.synchronizer = new CacheSynchronizer(this.repo.metadata.tableName, ({id}) => id);
  }

  async initialize(): Promise<void> {
    await this.synchronizer.initialize();
  }

  async fetch(guild: GuildWrapperResolvable): Promise<GuildWrapper> {
    if (guild instanceof GuildWrapper) return guild;
    const id = this.resolveIdChecked(guild);

    const cached = await this.cache.get(id);
    if (cached) return cached;

    const discordGuild = await this.discordGuilds.fetch(id);
    const entity = await this.repo.createQueryBuilder().select().where({id}).getOne();
    const syncStream = this.synchronizer.getSyncStream(id);
    const wrapper = new GuildWrapper(this, syncStream, entity, discordGuild);
    wrapper.afterCacheStateChange.subscribe(() => this.synchronizer.removeSyncStream(id));
    this.cacheWrapper(id, wrapper);
    return wrapper;
  }

  async hasDatabaseEntry(guild: GuildWrapperResolvable): Promise<boolean> {
    if (guild instanceof GuildWrapper) return !!guild.entity;
    const id = this.resolveIdChecked(guild);

    const cached = await this.cache.get(id);
    if (cached) return !!cached.entity;

    return !!(await this.repo.createQueryBuilder().select('1').where({id}).getCount());
  }

  resolve(resolvable: GuildWrapperResolvable): GuildWrapper | undefined {
    if (resolvable instanceof GuildWrapper) return resolvable;
    if (resolvable instanceof GuildMemberWrapper) return resolvable.guild;
    const id = this.discordGuilds.resolveID(resolvable);
    if (!id) return undefined;
    return this.cache.get(id);
  }

  resolveId(resolvable: GuildWrapperResolvable): Snowflake | undefined {
    if (resolvable instanceof GuildWrapper) return resolvable.id;
    if (resolvable instanceof GuildMemberWrapper) return resolvable.guild.id;
    return this.discordGuilds.resolveID(resolvable) ?? undefined;
  }

  resolveIdChecked(resolvable: GuildWrapperResolvable): Snowflake {
    const id = this.resolveId(resolvable);
    if (id === undefined) throw new Error('GuildWrapperResolvable could not be resolved to an id.');
    return id;
  }
}
