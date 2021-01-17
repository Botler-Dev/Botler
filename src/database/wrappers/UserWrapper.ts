import dayjs, {Dayjs} from 'dayjs';
import {Snowflake, User, UserResolvable} from 'discord.js';
import {FindConditions} from 'typeorm';
import UserEntity from '../entities/UserEntity';
import type UserManager from '../managers/UserManager';
import {SyncStream} from '../synchronizer/CacheSynchronizer';
import CacheEntityWrapper from '../wrapper/CacheEntityWrapper';
import DiscordWrapper from '../wrapper/DiscordWrapper';
import type GuildMemberWrapper from './GuildMemberWrapper';

export type UserWrapperResolvable = UserWrapper | GuildMemberWrapper | UserResolvable;

export default class UserWrapper
  extends CacheEntityWrapper<UserEntity | undefined, UserManager, UserWrapper>
  implements DiscordWrapper<User> {
  readonly discord: User;

  get id(): Snowflake {
    return this.discord.id;
  }

  get birthDate(): Dayjs | undefined {
    return this.entity?.birthDate ? dayjs.utc(this.entity.birthDate) : undefined;
  }

  set birthDate(value: Dayjs | undefined) {
    this.updateEntity({
      birthDate: value?.utc().format('YYYY-MM-DD'),
    });
  }

  protected uniqueConditions: FindConditions<UserEntity>;

  constructor(
    manager: UserManager,
    syncStream: SyncStream<UserEntity>,
    entity: UserEntity | undefined,
    discordObject: User
  ) {
    super(manager, syncStream, entity);
    this.discord = discordObject;
    this.uniqueConditions = {
      id: discordObject.id,
    };
  }

  protected createDefaultEntity(): UserEntity {
    return {
      id: this.discord.id,
    };
  }

  isEntityUseless(): boolean {
    return !this.entity || Object.entries(this.entity).filter(([, value]) => !!value).length === 1;
  }

  toString(): string {
    return this.discord.toString();
  }
}
