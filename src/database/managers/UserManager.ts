import {Client, Snowflake, UserManager as DiscordUserManager} from 'discord.js';
import {container} from 'tsyringe';
import {Connection} from 'typeorm';
import UserEntity from '../entities/UserEntity';
import CacheManager from '../manager/CacheManager';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';
import GuildMemberWrapper from '../wrappers/GuildMemberWrapper';
import UserWrapper, {UserWrapperResolvable} from '../wrappers/UserWrapper';

export default class UserManager extends CacheManager<UserEntity, Snowflake, UserWrapper> {
  private readonly discordUsers: DiscordUserManager;

  private readonly synchronizer: CacheSynchronizer<UserEntity, 'id', Snowflake>;

  constructor(connection?: Connection, {users} = container.resolve(Client)) {
    super(UserEntity, connection);
    this.discordUsers = users;
    this.synchronizer = new CacheSynchronizer(this.repo.metadata.tableName, ({id}) => id);
  }

  async initialize(): Promise<void> {
    await this.synchronizer.initialize();
  }

  async fetch(user: UserWrapperResolvable): Promise<UserWrapper> {
    if (user instanceof UserWrapper) return user;
    const id = this.resolveIdChecked(user);

    const cached = await this.cache.get(id);
    if (cached) return cached;

    const discordUser = await this.discordUsers.fetch(id);
    const entity = await this.repo.createQueryBuilder().select().where({id}).getOne();
    const syncStream = this.synchronizer.getSyncStream(id);
    const wrapper = new UserWrapper(this, syncStream, entity, discordUser);
    wrapper.afterUncache.subscribe(() => this.synchronizer.removeSyncStream(id));
    this.cacheWrapper(id, wrapper);
    return wrapper;
  }

  async hasDatabaseEntry(user: UserWrapperResolvable): Promise<boolean> {
    if (user instanceof UserWrapper) return !!user.entity;
    const id = this.resolveIdChecked(user);

    const cached = await this.cache.get(id);
    if (cached) return !!cached.entity;

    return !!(await this.repo.createQueryBuilder().select('1').where({id}).getCount());
  }

  resolve(resolvable: UserWrapperResolvable): UserWrapper | undefined {
    if (resolvable instanceof UserWrapper) return resolvable;
    const id = this.resolveId(resolvable);
    if (!id) return undefined;
    return this.cache.get(id);
  }

  resolveId(resolvable: UserWrapperResolvable): Snowflake | undefined {
    if (resolvable instanceof UserWrapper || resolvable instanceof GuildMemberWrapper)
      return resolvable.id;
    return this.discordUsers.resolveID(resolvable) ?? undefined;
  }

  resolveIdChecked(resolvable: UserWrapperResolvable): Snowflake {
    const id = this.resolveId(resolvable);
    if (id === undefined) throw new Error('UserWrapperResolvable could not be resolved to an id.');
    return id;
  }
}
