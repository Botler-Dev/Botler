import {Message, TextBasedChannelResolvable, UserManager, UserResolvable} from 'discord.js';
import {injectable} from 'tsyringe';
import {Connection, FindConditions} from 'typeorm';
import {resolveTextBasedChannelId, resolveIdChecked} from '../../../utils/resolve';
import ResponseListenerEntity from '../../entities/command/ResponseListenerEntity';
import EntityManager from '../../manager/EntityManager';

@injectable()
export default class ResponseListenerManager extends EntityManager<ResponseListenerEntity> {
  private readonly userManager: UserManager;

  constructor(connection: Connection, userManager: UserManager) {
    super(ResponseListenerEntity, connection);
    this.userManager = userManager;
  }

  async addListener(
    cacheId: number,
    channel: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    await this.removeListener(cacheId, channel, user);
    await this.repo.insert({
      channel: resolveTextBasedChannelId(channel),
      user: user === undefined ? '' : resolveIdChecked(this.userManager, user),
      cache: cacheId,
    });
  }

  async removeListener(
    cacheId: number,
    channel?: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    const conditions: FindConditions<ResponseListenerEntity> = {
      cache: cacheId,
    };
    if (channel) conditions.channel = resolveTextBasedChannelId(channel);
    if (user) conditions.user = resolveIdChecked(this.userManager, user);
    await this.repo.delete(conditions);
  }

  async findCacheIds(message: Message): Promise<number[]> {
    // TODO: refactor findCacheIds methods in Response and ReactionListenerManager and add the distinct flag
    const result = await this.repo.find({
      where: [
        {
          channel: message.channel.id,
          user: '',
        },
        {
          channel: message.channel.id,
          user: message.author.id,
        },
      ],
      select: ['cache'],
    });
    return result.map(entity => entity.cache);
  }
}
