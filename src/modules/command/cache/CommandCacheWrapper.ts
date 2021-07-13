import {CommandCommandCache} from '@prisma/client';
import dayjs, {Dayjs} from 'dayjs';
import {
  EmojiResolvable,
  MessageResolvable,
  TextBasedChannelResolvable,
  UserResolvable,
} from 'discord.js';
import {CachedEntityWrapper} from '@/database';
import {Command} from '../command/Command';
import {ReactionAction} from '../executionContexts/ReactionExecutionContext';
import type {CommandCacheManager} from './CommandCacheManager';
import {ReactionListenerManager} from './listeners/ReactionListenerManager';
import {ResponseListenerManager} from './listeners/ResponseListenerManager';

export interface GenericCommandCommandCache<TCache> extends CommandCommandCache {
  cache: TCache;
}

export type CacheFromCommandCacheWrapper<TWrapper extends ConcreteCommandCacheWrapper> =
  TWrapper extends CommandCacheWrapper<infer TCache> ? TCache : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConcreteCommandCacheWrapper = CommandCacheWrapper<any>;

/**
 * Cache for command state between command executions.
 *
 * {@link CommandCacheWrapper.entity} is persistent across restarts and instance properties are persistent until restart.
 */
export abstract class CommandCacheWrapper<TCache = unknown> extends CachedEntityWrapper<
  GenericCommandCommandCache<TCache>
> {
  /**
   * Delay before deleting a command cache.
   * Exists so caches don't get deleted while commands are executing.
   */
  static readonly DELETE_DELAY = dayjs.duration(5, 'minutes');

  private _entity: GenericCommandCommandCache<TCache>;

  /**
   * Cache data persistent across restarts.
   */
  get entity(): Readonly<GenericCommandCommandCache<TCache>> {
    return this._entity;
  }

  get id(): number {
    return this.entity.id;
  }

  /**
   * Command this cache is for.
   */
  readonly command: Command;

  /**
   * When the cache expires to never be used again and eventually be deleted after {@link CommandCacheWrapper.DELETE_DELAY}.
   *
   * Can be updated to a new value which will take effect locally (not in the database) immediately.
   */
  get expirationDateTime(): Dayjs {
    return dayjs(this.entity.expirationDateTime);
  }

  set expirationDateTime(value: Dayjs) {
    this._entity.expirationDateTime = value.toDate();

    clearTimeout(this.deleteTimeout);
    if (dayjs().isAfter(value)) {
      this.delete();
      return;
    }
    this.setTimeout();
  }

  private deleteTimeout!: NodeJS.Timeout;

  private readonly manager: CommandCacheManager;

  private readonly responseListenerManager: ResponseListenerManager;

  private readonly reactionListenerManager: ReactionListenerManager;

  constructor(
    responseListenerManager: ResponseListenerManager,
    reactionListenerManager: ReactionListenerManager,
    manager: CommandCacheManager,
    entity: GenericCommandCommandCache<TCache>,
    command: Command
  ) {
    super();
    this._entity = entity;
    this.command = command;
    this.manager = manager;
    this.responseListenerManager = responseListenerManager;
    this.reactionListenerManager = reactionListenerManager;

    this.setTimeout();
  }

  private setTimeout() {
    this.deleteTimeout = setTimeout(
      () => this.delete(),
      this.expirationDateTime.add(CommandCacheWrapper.DELETE_DELAY).diff(dayjs())
    );
  }

  /**
   * Sets the cache data of the entity.
   */
  protected setCache(cache: TCache): void {
    this._entity.cache = cache;
  }

  /**
   * Adds a response listener as trigger and removes any listener with an overlapping scope.
   */
  async addResponseListener(
    channel: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    this.responseListenerManager.addListener(this.id, channel, user);
  }

  /**
   * Removes any response listener in the defined scope.
   */
  async removeResponseListener(
    channel?: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    this.responseListenerManager.removeListener(this.id, channel, user);
  }

  /**
   * Adds a reaction listener as trigger and removes any listener with an overlapping scope.
   */
  async addReactionListener(
    message: MessageResolvable,
    user?: UserResolvable,
    emoji?: EmojiResolvable | string,
    action?: ReactionAction
  ): Promise<void> {
    this.reactionListenerManager.addListener(this.id, message, user, emoji, action);
  }

  /**
   * Removes any reaction listener in the defined scope.
   */
  async removeReactionListener(
    message?: MessageResolvable,
    user?: UserResolvable,
    emoji?: EmojiResolvable | string,
    action?: ReactionAction
  ): Promise<void> {
    this.reactionListenerManager.removeListener(this.id, message, user, emoji, action);
  }

  /**
   * If this cache has expired.
   */
  isExpired(now = dayjs()): boolean {
    return now.isAfter(this.expirationDateTime);
  }

  async save(): Promise<void> {
    await this.manager.model.update({
      data: this._entity,
      where: {
        id: this.id,
      },
    });
  }

  async delete(): Promise<void> {
    this.decache();
    clearTimeout(this.deleteTimeout);
    await this.manager.model.delete({
      where: {
        id: this.id,
      },
    });
  }
}
