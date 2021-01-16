import {Client, Snowflake, UserManager as DiscordUserManager} from 'discord.js';
import {container} from 'tsyringe';
import {Connection} from 'typeorm';
import UserEntity from '../entities/UserEntity';
import CacheManager from '../manager/CacheManager';
import UserSynchronizer from '../synchronizers/UserSynchronizer';
import UserWrapper, {UserWrapperResolvable} from '../wrappers/UserWrapper';

export default class UserManager extends CacheManager<
  UserEntity,
  UserWrapper,
  Snowflake,
  UserSynchronizer,
  UserManager
> {
  private readonly discordUsers: DiscordUserManager;

  constructor(connection?: Connection, {users} = container.resolve(Client)) {
    super(UserEntity, table => new UserSynchronizer(table), connection);
    this.discordUsers = users;
  }

  async fetch(user: UserWrapperResolvable): Promise<UserWrapper> {
    if (user instanceof UserWrapper) return user;
    const id = this.discordUsers.resolveID(user);
    if (!id) throw new Error('UserResolvable could not be resolved to an id.');
    const discordUser = await this.discordUsers.fetch(id);
    const entity = await this.repo.createQueryBuilder().select().where({id}).getOne();
    const wrapper = this.registerWrapper(
      id,
      stream => new UserWrapper(this, stream, entity, discordUser)
    );
    return wrapper;
  }

  async hasDatabaseEntry(user: UserWrapperResolvable): Promise<boolean> {
    if (user instanceof UserWrapper) return !!user.entity;
    const id = this.discordUsers.resolveID(user);
    if (!id) throw new Error('UserResolvable could not be resolved to an id.');
    return !!(await this.repo.createQueryBuilder().select('1').where({id}).getCount());
  }

  resolve(resolvable: UserWrapperResolvable): UserWrapper | undefined {
    if (resolvable instanceof UserWrapper) return resolvable;
    const id = this.discordUsers.resolveID(resolvable);
    if (!id) return undefined;
    return this.cache.get(id);
  }

  resolveId(resolvable: UserWrapperResolvable): Snowflake | undefined {
    if (resolvable instanceof UserWrapper) return resolvable.id;
    return this.discordUsers.resolveID(resolvable) ?? undefined;
  }
}
