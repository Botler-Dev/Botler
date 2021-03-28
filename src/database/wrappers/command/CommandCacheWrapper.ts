import dayjs, {Dayjs} from 'dayjs';
import {FindConditions} from 'typeorm';
import {
  EmojiResolvable,
  MessageResolvable,
  TextBasedChannelResolvable,
  UserResolvable,
} from 'discord.js';
import CachedEntityWrapper from '../../wrapper/CachedEntityWrapper';
import CommandCacheEntity from '../../entities/command/CommandCacheEntity';
import type CommandCacheManager from '../../managers/command/CommandCacheManager';
import ResponseListenerManager from '../../managers/command/listener/ResponseListenerManager';
import type ReactionListenerManager from '../../managers/command/listener/ReactionListenerManager';
import type Command from '../../../modules/command/command/Command';
import type {ReactionAction} from '../../../modules/command/executionContexts/ReactionExecutionContext';

export type CacheFromCommandCacheWrapper<
  TWrapper extends ConcreteCommandCacheWrapper
> = TWrapper extends CommandCacheWrapper<infer TCache> ? TCache : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConcreteCommandCacheWrapper = CommandCacheWrapper<any>;

export default abstract class CommandCacheWrapper<TCache = unknown> extends CachedEntityWrapper<
  CommandCacheEntity<TCache>,
  CommandCacheManager
> {
  private _entity: CommandCacheEntity<TCache>;

  get entity(): Readonly<CommandCacheEntity<TCache>> {
    return this._entity;
  }

  get id(): number {
    return this.entity.id;
  }

  readonly command: Command;

  get expirationDateTime(): Dayjs {
    return dayjs(this.entity.expirationDateTime as Date);
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

  protected readonly uniqueConditions: FindConditions<CommandCacheEntity<TCache>>;

  private readonly responseListenerManager: ResponseListenerManager;

  private readonly reactionListenerManager: ReactionListenerManager;

  constructor(
    manager: CommandCacheManager,
    entity: CommandCacheEntity<TCache>,
    command: Command,
    responseListenerManager: ResponseListenerManager,
    reactionListenerManager: ReactionListenerManager
  ) {
    super(manager);
    this._entity = entity;
    this.command = command;
    this.responseListenerManager = responseListenerManager;
    this.reactionListenerManager = reactionListenerManager;

    this.uniqueConditions = {
      id: this.id,
    };
    this.setTimeout();
  }

  private setTimeout() {
    this.deleteTimeout = setTimeout(
      () => this.delete(),
      this.expirationDateTime.add(CommandCacheEntity.DELETE_DELAY).diff(dayjs())
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

  // eslint-disable-next-line class-methods-use-this
  isEntityUseless(): boolean {
    return false;
  }

  isExpired(now = dayjs()): boolean {
    return now.isAfter(this.expirationDateTime);
  }

  async delete(): Promise<void> {
    this.uncache();
    clearTimeout(this.deleteTimeout);
    await super.delete();
  }
}
