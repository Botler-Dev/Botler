import {CommandCommandCache} from '@prisma/client';
import dayjs, {Dayjs} from 'dayjs';
import {
  EmojiResolvable,
  MessageResolvable,
  TextBasedChannelResolvable,
  UserResolvable,
} from 'discord.js';
import CachedEntityWrapper from '@/database/wrapper/CachedEntityWrapper';
import Command from '../command/Command';
import {ReactionAction} from '../executionContexts/ReactionExecutionContext';
import type CommandCacheManager from './CommandCacheManager';
import ReactionListenerManager from './listeners/ReactionListenerManager';
import ResponseListenerManager from './listeners/ResponseListenerManager';

export interface GenericCommandCommandCache<TCache> extends CommandCommandCache {
  cache: TCache;
}

export type CacheFromCommandCacheWrapper<
  TWrapper extends ConcreteCommandCacheWrapper
> = TWrapper extends CommandCacheWrapper<infer TCache> ? TCache : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConcreteCommandCacheWrapper = CommandCacheWrapper<any>;

export default abstract class CommandCacheWrapper<TCache = unknown> extends CachedEntityWrapper<
  GenericCommandCommandCache<TCache>,
  CommandCacheManager
> {
  static DELETE_DELAY = dayjs.duration(5, 'minutes');

  private _entity: GenericCommandCommandCache<TCache>;

  get entity(): Readonly<GenericCommandCommandCache<TCache>> {
    return this._entity;
  }

  get id(): number {
    return this.entity.id;
  }

  readonly command: Command;

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

  private readonly responseListenerManager: ResponseListenerManager;

  private readonly reactionListenerManager: ReactionListenerManager;

  constructor(
    manager: CommandCacheManager,
    entity: GenericCommandCommandCache<TCache>,
    command: Command,
    responseListenerManager: ResponseListenerManager,
    reactionListenerManager: ReactionListenerManager
  ) {
    super(manager);
    this._entity = entity;
    this.command = command;
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

  protected setCache(cache: TCache): void {
    this._entity.cache = cache;
  }

  async addResponseListener(
    channel: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    this.responseListenerManager.addListener(this.id, channel, user);
  }

  async removeResponseListener(
    channel?: TextBasedChannelResolvable,
    user?: UserResolvable
  ): Promise<void> {
    this.responseListenerManager.removeListener(this.id, channel, user);
  }

  async addReactionListener(
    message: MessageResolvable,
    user?: UserResolvable,
    emoji?: EmojiResolvable | string,
    action?: ReactionAction
  ): Promise<void> {
    this.reactionListenerManager.addListener(this.id, message, user, emoji, action);
  }

  async removeReactionListener(
    message?: MessageResolvable,
    user?: UserResolvable,
    emoji?: EmojiResolvable | string,
    action?: ReactionAction
  ): Promise<void> {
    this.reactionListenerManager.removeListener(this.id, message, user, emoji, action);
  }

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
    this.uncache();
    clearTimeout(this.deleteTimeout);
    await this.manager.model.delete({
      where: {
        id: this.id,
      },
    });
  }
}
