import {
  Message,
  Snowflake,
  TextBasedChannelResolvable,
  UserManager,
  UserResolvable,
} from 'discord.js';
import {from} from 'rxjs';
import {mergeAll} from 'rxjs/operators';
import {injectable} from 'tsyringe';
import {Connection} from 'typeorm';
import {resolveTextBasedChannelId, resolveIdChecked} from '../../../../utils/resolve';
import DatabaseEventHub from '../../../DatabaseEventHub';
import ResponseListenerEntity from '../../../entities/command/ResponseListenerEntity';
import EntityManager from '../../../manager/EntityManager';
import ListenerCriterionCache from './ListenerCriterionCache';

@injectable()
export default class ResponseListenerManager extends EntityManager<ResponseListenerEntity> {
  private readonly cache = new ListenerCriterionCache<
    [channelId?: Snowflake, userId?: Snowflake]
  >();

  private readonly userManager: UserManager;

  constructor(connection: Connection, eventHub: DatabaseEventHub, userManager: UserManager) {
    super(ResponseListenerEntity, connection);
    this.userManager = userManager;
    from(eventHub.listenTo<ResponseListenerEntity>(`sync_${this.repo.metadata.tableName}_DELETE`))
      .pipe(mergeAll())
      .subscribe(entity => this.cache.remove(entity.cache, entity.user || undefined));
  }

  async initialize(): Promise<void> {
    const listeners = await this.repo.find();
    listeners.forEach(listener =>
      this.cache.add(listener.cache, listener.channel, listener.user || undefined)
    );
  }

  private resolveParameters<TChannelOptional extends undefined>(
    channel: TextBasedChannelResolvable | TChannelOptional,
    user?: UserResolvable
  ) {
    return {
      channelId: channel ? resolveTextBasedChannelId(channel) : channel,
      userId: user ? resolveIdChecked(this.userManager, user) : undefined,
    };
  }

  async addListener(
    cacheId: number,
    channel: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    const {channelId, userId} = this.resolveParameters<never>(channel, user);
    await this.removeListener(cacheId, channelId, userId);
    this.cache.add(cacheId, channelId, userId);
    await this.repo.insert({
      channel: channelId,
      user: userId,
      cache: cacheId,
    });
  }

  async removeListener(
    cacheId: number,
    channel?: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    const {channelId, userId} = this.resolveParameters(channel, user);
    this.cache.remove(cacheId, channelId, userId);
    await this.repo.delete({
      cache: cacheId,
      channel: channelId,
      user: userId,
    });
  }

  findCacheIds(message: Message): number[] {
    // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
    return this.cache.find(message.channel.id, message.author.id);
  }
}
