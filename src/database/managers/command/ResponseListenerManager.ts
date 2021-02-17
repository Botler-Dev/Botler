import {Message, TextBasedChannelResolvable} from 'discord.js';
import {injectable} from 'tsyringe';
import {Connection, FindConditions} from 'typeorm';
import resolveTextBasedChannelId from '../../../utils/resolveTextBasedChannelId';
import ResponseListenerEntity from '../../entities/command/ResponseListenerEntity';
import WrapperManager from '../../manager/WrapperManager';
import {UserWrapperResolvable} from '../../wrappers/UserWrapper';
import UserManager from '../UserManager';

@injectable()
export default class ResponseListenerManager extends WrapperManager<ResponseListenerEntity> {
  private readonly userManager: UserManager;

  constructor(connection: Connection, userManager: UserManager) {
    super(ResponseListenerEntity, connection);
    this.userManager = userManager;
  }

  async addListener(
    cacheId: number,
    channel: TextBasedChannelResolvable,
    user?: UserWrapperResolvable
  ): Promise<void> {
    await this.removeListener(cacheId, channel, user);
    await this.repo.insert({
      channel: resolveTextBasedChannelId(channel),
      user: user === undefined ? '' : this.userManager.resolveIdChecked(user),
      cache: cacheId,
    });
  }

  async removeListener(
    cacheId: number,
    channel?: TextBasedChannelResolvable,
    user?: UserWrapperResolvable
  ): Promise<void> {
    const conditions: FindConditions<ResponseListenerEntity> = {
      cache: cacheId,
    };
    if (channel) conditions.channel = resolveTextBasedChannelId(channel);
    if (user) conditions.user = this.userManager.resolveIdChecked(user);
    await this.repo.delete(conditions);
  }

  async findCacheIds(message: Message): Promise<number[]> {
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
