import {Snowflake, GuildManager as DiscordGuildManager, Client} from 'discord.js';
import {container} from 'tsyringe';
import {Connection} from 'typeorm';
import GuildEntity from '../entities/GuildEntity';
import CacheManager from '../manager/CacheManager';
import GuildSynchronizer from '../synchronizers/GuildSynchronizer';
import GuildWrapper, {GuildWrapperResolvable} from '../wrappers/GuildWrapper';

export default class GuildManager extends CacheManager<
  GuildEntity,
  GuildWrapper,
  Snowflake,
  GuildSynchronizer,
  GuildManager
> {
  private readonly discordGuilds: DiscordGuildManager;

  constructor(connection?: Connection, {guilds} = container.resolve(Client)) {
    super(GuildEntity, table => new GuildSynchronizer(table), connection);
    this.discordGuilds = guilds;
  }

  async fetch(guild: GuildWrapperResolvable): Promise<GuildWrapper> {
    if (guild instanceof GuildWrapper) return guild;
    const id = this.discordGuilds.resolveID(guild);
    if (!id) throw new Error('GuildResolvable could not be resolved to an id.');
    const discordGuild = await this.discordGuilds.fetch(id);
    const entity = await this.repo.createQueryBuilder().select().where({id}).getOne();
    const wrapper = this.registerWrapper(
      id,
      stream => new GuildWrapper(this, stream, entity, discordGuild)
    );
    return wrapper;
  }

  async hasDatabaseEntry(guild: GuildWrapperResolvable): Promise<boolean> {
    if (guild instanceof GuildWrapper) return !!guild.entity;
    const id = this.discordGuilds.resolveID(guild);
    if (!id) throw new Error('GuildResolvable could not be resolved to an id.');
    return !!(await this.repo.createQueryBuilder().select('1').where({id}).getCount());
  }

  resolve(resolvable: GuildWrapperResolvable): GuildWrapper | undefined {
    if (resolvable instanceof GuildWrapper) return resolvable;
    const id = this.discordGuilds.resolveID(resolvable);
    if (!id) return undefined;
    return this.cache.get(id);
  }

  resolveId(resolvable: GuildWrapperResolvable): Snowflake | undefined {
    if (resolvable instanceof GuildWrapper) return resolvable.id;
    return this.discordGuilds.resolveID(resolvable) ?? undefined;
  }
}
