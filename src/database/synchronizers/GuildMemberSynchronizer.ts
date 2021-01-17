import DatabaseEventHub from '../DatabaseEventHub';
import GuildMemberEntity, {guildMemberTableName} from '../entities/GuildMemberEntity';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';

export function generateGuildMemberSynchronizerCacheKey(guildId: string, userId: string): string {
  return `${guildId}-${userId}`;
}

export default class GuildMemberSynchronizer extends CacheSynchronizer<
  GuildMemberEntity,
  'user' | 'guild',
  string
> {
  constructor(eventHub?: DatabaseEventHub) {
    super(
      guildMemberTableName,
      ({guild, user}) => generateGuildMemberSynchronizerCacheKey(guild, user),
      eventHub
    );
  }
}
