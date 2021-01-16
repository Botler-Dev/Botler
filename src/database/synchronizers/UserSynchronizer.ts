import {Snowflake} from 'discord.js';
import UserEntity from '../entities/UserEntity';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';

export interface UserDeletePayload {
  id: Snowflake;
}

export default class UserSynchronizer extends CacheSynchronizer<
  UserEntity,
  Snowflake,
  UserDeletePayload
> {
  // eslint-disable-next-line class-methods-use-this
  protected getCacheKeyFromEntity(entity: UserEntity): string | undefined {
    return entity.id;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getCacheKeyFromDelete(payload: UserDeletePayload): string | undefined {
    return payload.id;
  }
}
