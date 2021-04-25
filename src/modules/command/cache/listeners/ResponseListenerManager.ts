import {CommandResponseListener, Prisma, PrismaClient} from '@prisma/client';
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
import DatabaseEventHub from '@/database/DatabaseEventHub';
import EntityManager from '@/database/manager/EntityManager';
import {resolveIdChecked, resolveTextBasedChannelId} from '@/utils/resolve';
import ListenerCriterionCache from './ListenerCriterionCache';

@injectable()
export default class ResponseListenerManager extends EntityManager<
  PrismaClient['commandResponseListener']
> {
  private readonly cache = new ListenerCriterionCache<
    [channelId?: Snowflake, userId?: Snowflake]
  >();

  private readonly userManager: UserManager;

  constructor(prisma: PrismaClient, eventHub: DatabaseEventHub, userManager: UserManager) {
    super(prisma.commandResponseListener);
    this.userManager = userManager;
    from(
      eventHub.listenTo<CommandResponseListener>(
        `sync_${Prisma.ModelName.CommandResponseListener}_DELETE`
      )
    )
      .pipe(mergeAll())
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .subscribe(entity => this.cache.remove(entity.cacheId!, entity.userId || undefined));
  }

  async initialize(): Promise<void> {
    const listeners = await this.model.findMany();
    listeners.forEach(listener =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.cache.add(listener.cacheId!, listener.channelId, listener.userId || undefined)
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
    await this.model.create({
      data: {
        channelId,
        userId: userId ?? '',
        cacheId,
      },
    });
  }

  async removeListener(
    cacheId: number,
    channel?: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    const {channelId, userId} = this.resolveParameters(channel, user);
    this.cache.remove(cacheId, channelId, userId);
    await this.model.deleteMany({
      where: {
        cacheId,
        channelId,
        userId,
      },
    });
  }

  findCacheIds(message: Message): number[] {
    // eslint-disable-next-line unicorn/no-array-callback-reference
    return this.cache.find(message.channel.id, message.author.id);
  }
}
