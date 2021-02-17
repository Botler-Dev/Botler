import {Connection} from 'typeorm';
import {injectable} from 'tsyringe';
import dayjs, {Dayjs} from 'dayjs';
import CacheManager from '../../manager/CacheManager';
import CommandCacheEntity from '../../entities/command/CommandCacheEntity';
import CommandCacheWrapper, {
  CacheFromCommandCacheWrapper,
  ConcreteCommandCacheWrapper,
} from '../../wrappers/command/CommandCacheWrapper';
import ReactionListenerManager from './ReactionListenerManager';
import ResponseListenerManager from './ResponseListenerManager';
import CommandManager from '../../../modules/command/CommandManager';
import ScopedLogger from '../../../logger/ScopedLogger';
import Command from '../../../modules/command/command/Command';

@injectable()
export default class CommandCacheManager extends CacheManager<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CommandCacheEntity<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CommandCacheWrapper<any>,
  number,
  CommandCacheManager
> {
  private readonly logger: ScopedLogger;

  private readonly commandManager: CommandManager;

  private readonly responseListenerManager: ResponseListenerManager;

  private readonly reactionListenerManager: ReactionListenerManager;

  constructor(
    connection: Connection,
    logger: ScopedLogger,
    commandManager: CommandManager,
    responseListenerManager: ResponseListenerManager,
    reactionListenerManager: ReactionListenerManager
  ) {
    super(CommandCacheEntity, connection);
    this.logger = logger;
    this.commandManager = commandManager;
    this.responseListenerManager = responseListenerManager;
    this.reactionListenerManager = reactionListenerManager;
  }

  private async wrapEntity<TCache extends ConcreteCommandCacheWrapper>(
    command: Command<TCache>,
    entity: CommandCacheEntity<CacheFromCommandCacheWrapper<TCache>>
  ): Promise<TCache | undefined> {
    if (!command?.wrapCacheEntity) {
      this.logger.warn(
        `Encountered cache for command "${command.name}" which has the cache entity wrapping not implemented.`
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
    const entity = new CommandCacheEntity<TCache>();
    entity.command = command.name;
    entity.expirationDateTime = expirationDateTime.toDate();
    entity.cache = cache;
    entity.id = (await this.repo.insert(entity)).generatedMaps[0].id;
    const wrapper = await this.wrapEntity(command, entity);
    if (!wrapper) throw new Error(`Could not create cache for command "${command.name}".`);
    return wrapper;
  }

  async fetchCaches(ids: number[], now = dayjs()): Promise<CommandCacheWrapper<unknown>[]> {
    const cachedWrappers = ids.map(id => this.cache.get(id));
    const wrappers = cachedWrappers.filter(wrapper => !wrapper?.isExpired(now));
    const uncachedIds = ids.filter((_, index) => !cachedWrappers[index]);

    if (uncachedIds.length > 0) {
      const entities = await this.repo
        .createQueryBuilder('cache')
        .select()
        .where('cache.id IN (:...ids)', {ids: uncachedIds})
        .andWhere('cache.expirationDateTime >= :now', {now: now.toISOString()})
        .getMany();
      wrappers.concat(
        await Promise.all(
          entities.map(entity => {
            const command = this.commandManager.instances.get(entity.command);
            if (!command) {
              this.logger.warn(`Could not find command "${entity.command}" specified in cache.`);
              return undefined;
            }
            return this.wrapEntity(command, entity);
          })
        )
      );
    }

    return wrappers.filter((wrapper): wrapper is Exclude<typeof wrapper, undefined> => !!wrapper);
  }
}
