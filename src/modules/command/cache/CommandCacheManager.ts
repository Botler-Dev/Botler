import {PrismaClient} from '@prisma/client';
import dayjs, {Dayjs} from 'dayjs';
import {injectable} from 'tsyringe';
import DatabaseCleaner from '@/database/DatabaseCleaner';
import CacheManager from '@/database/manager/CacheManager';
import Logger from '@/logger/Logger';
import Command from '../command/Command';
import CommandManager from '../CommandManager';
import CommandCacheWrapper, {
  CacheFromCommandCacheWrapper,
  ConcreteCommandCacheWrapper,
  GenericCommandCommandCache,
} from './CommandCacheWrapper';
import ReactionListenerManager from './listeners/ReactionListenerManager';
import ResponseListenerManager from './listeners/ResponseListenerManager';

@injectable()
export default class CommandCacheManager extends CacheManager<
  PrismaClient['commandCommandCache'],
  number,
  ConcreteCommandCacheWrapper
> {
  private readonly logger: Logger;

  private readonly commandManager: CommandManager;

  private readonly responseListenerManager: ResponseListenerManager;

  private readonly reactionListenerManager: ReactionListenerManager;

  constructor(
    prisma: PrismaClient,
    logger: Logger,
    cleaner: DatabaseCleaner,
    commandManager: CommandManager,
    responseListenerManager: ResponseListenerManager,
    reactionListenerManager: ReactionListenerManager
  ) {
    super(prisma.commandCommandCache);
    this.logger = logger;
    this.commandManager = commandManager;
    this.responseListenerManager = responseListenerManager;
    this.reactionListenerManager = reactionListenerManager;

    cleaner.registerCleaner(() => this.clean());
  }

  private async wrapEntity<TCache extends ConcreteCommandCacheWrapper>(
    command: Command<TCache>,
    entity: GenericCommandCommandCache<CacheFromCommandCacheWrapper<TCache>>
  ): Promise<TCache | undefined> {
    if (!command?.wrapCacheEntity) {
      this.logger.warn(
        `Encountered cache for command "${command.name}" which has the "wrapCacheEntity()" method not implemented.`
      );
      return undefined;
    }
    try {
      const wrapper = await command.wrapCacheEntity(
        this,
        entity,
        this.responseListenerManager,
        this.reactionListenerManager
      );
      this.cacheWrapper(wrapper.id, wrapper);
      return wrapper;
    } catch (error) {
      this.logger.error(
        `Encountered error when generating cache from entity for command "${command.name}".`,
        error
      );
      return undefined;
    }
  }

  async createCache<
    TWrapper extends ConcreteCommandCacheWrapper,
    TCache extends CacheFromCommandCacheWrapper<TWrapper>
  >(command: Command<TWrapper>, expirationDateTime: Dayjs, cache: TCache): Promise<TWrapper> {
    const entity = (await this.model.create({
      data: {
        commandName: command.name,
        expirationDateTime: expirationDateTime.toDate(),
        cache,
      },
    })) as GenericCommandCommandCache<TCache>;
    const wrapper = await this.wrapEntity(command, entity);
    if (!wrapper) throw new Error(`Could not create cache for command "${command.name}".`);
    return wrapper;
  }

  async fetchCaches(ids: number[], now = dayjs()): Promise<CommandCacheWrapper<unknown>[]> {
    const cachedWrappers = ids.map(id => this.cache.get(id));
    const wrappers = cachedWrappers.filter(wrapper => !wrapper?.isExpired(now));
    const uncachedIds = ids.filter((_, index) => !cachedWrappers[index]);

    if (uncachedIds.length > 0) {
      const entities = await this.model.findMany({
        where: {
          id: {in: uncachedIds},
          expirationDateTime: {gte: new Date()},
        },
      });
      wrappers.push(
        ...(await Promise.all(
          entities.map(entity => {
            const command = this.commandManager.instances.get(entity.commandName);
            if (!command) {
              this.logger.warn(
                `Could not find command "${entity.commandName}" specified in command cache.`
              );
              return undefined;
            }
            return this.wrapEntity(command, entity);
          })
        ))
      );
    }

    return wrappers.filter((wrapper): wrapper is Exclude<typeof wrapper, undefined> => !!wrapper);
  }

  async clean(): Promise<void> {
    await this.model.deleteMany({
      where: {
        expirationDateTime: {
          lt: dayjs().subtract(CommandCacheWrapper.DELETE_DELAY).toDate(),
        },
      },
    });
  }
}
