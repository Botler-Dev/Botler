import {Snowflake} from 'discord.js';
import GuildEntity from '../entities/GuildEntity';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';

export interface GuildDeletePayload {
  id: Snowflake;
}

export default class GuildSynchronizer extends CacheSynchronizer<
  GuildEntity,
  Snowflake,
  GuildDeletePayload
> {
  // eslint-disable-next-line class-methods-use-this
  protected getCacheKeyFromEntity(entity: GuildEntity): string {
    return entity.id;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getCacheKeyFromDelete(payload: GuildDeletePayload): string {
    return payload.id;
  }
}
