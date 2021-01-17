import {Snowflake} from 'discord.js';
import {container} from 'tsyringe';
import {Connection} from 'typeorm';
import GuildMemberEntity from '../entities/GuildMemberEntity';
import CacheManager from '../manager/CacheManager';
import GuildMemberSynchronizer, {
  generateGuildMemberSynchronizerCacheKey,
} from '../synchronizers/GuildMemberSynchronizer';
import GuildMemberWrapper, {GuildMemberWrapperResolvable} from '../wrappers/GuildMemberWrapper';
import type GuildWrapper from '../wrappers/GuildWrapper';
import UserWrapper from '../wrappers/UserWrapper';
import UserManager from './UserManager';

export default class GuildMemberManager extends CacheManager<
  GuildMemberEntity,
  GuildMemberWrapper,
  Snowflake,
  GuildMemberManager
> {
  readonly guild: GuildWrapper;

  private readonly userManager: UserManager;

  private readonly synchronizer: GuildMemberSynchronizer;

  constructor(
    guild: GuildWrapper,
    connection?: Connection,
    userManager = container.resolve(UserManager),
    synchronizer = container.resolve(GuildMemberSynchronizer)
  ) {
    super(GuildMemberEntity, connection);
    this.guild = guild;
    this.userManager = userManager;
    this.synchronizer = synchronizer;
  }

  async fetch(member: GuildMemberWrapperResolvable): Promise<GuildMemberWrapper> {
    if (member instanceof GuildMemberWrapper) return member;
    const id = this.resolveIdChecked(member);

    const cached = await this.cache.get(id);
    if (cached) return cached;

    const discordMember = await this.guild.discord.members.fetch(id);
    const entity = await this.repo
      .createQueryBuilder()
      .select()
      .where({guild: this.guild.id, user: id})
      .getOne();
    const syncCacheKey = generateGuildMemberSynchronizerCacheKey(this.guild.id, id);
    const syncStream = this.synchronizer.getSyncStream(syncCacheKey);
    const wrapper = new GuildMemberWrapper(
      this,
      syncStream,
      entity,
      discordMember,
      this.guild,
      this.userManager
    );
    wrapper.afterCacheStateChange.subscribe(() => this.synchronizer.removeSyncStream(syncCacheKey));
    this.cacheWrapper(id, wrapper);
    return wrapper;
  }

  async hasDatabaseEntry(member: GuildMemberWrapperResolvable): Promise<boolean> {
    if (member instanceof GuildMemberWrapper) return !!member.entity;
    const id = this.resolveIdChecked(member);

    const cached = await this.cache.get(id);
    if (cached) return !!cached.entity;

    return !!(await this.repo
      .createQueryBuilder()
      .select('1')
      .where({guild: this.guild.id, user: id})
      .getCount());
  }

  resolve(resolvable: GuildMemberWrapperResolvable): GuildMemberWrapper | undefined {
    if (resolvable instanceof GuildMemberWrapper) return resolvable;
    const id = this.resolveId(resolvable);
    if (!id) return undefined;
    return this.cache.get(id);
  }

  resolveId(resolvable: GuildMemberWrapperResolvable): Snowflake | undefined {
    if (resolvable instanceof GuildMemberWrapper || resolvable instanceof UserWrapper)
      return resolvable.id;
    return this.guild.discord.members.resolveID(resolvable) ?? undefined;
  }

  resolveIdChecked(resolvable: GuildMemberWrapperResolvable): Snowflake {
    const id = this.resolveId(resolvable);
    if (id === undefined)
      throw new Error('GuildMemberWrapperResolvable could not be resolved to an id.');
    return id;
  }
}
