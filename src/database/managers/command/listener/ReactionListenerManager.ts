import {
  EmojiResolvable,
  Message,
  MessageReaction,
  MessageResolvable,
  Snowflake,
  User,
  UserManager,
  UserResolvable,
} from 'discord.js';
import {from} from 'rxjs';
import {mergeAll} from 'rxjs/operators';
import {injectable} from 'tsyringe';
import {Connection} from 'typeorm';
import {ReactionAction} from '../../../../modules/command/executionContexts/ReactionExecutionContext';
import {resolveIdChecked} from '../../../../utils/resolve';
import DatabaseEventHub from '../../../DatabaseEventHub';
import ReactionListenerEntity, {
  toReactiveListenerActionFilter,
} from '../../../entities/command/ReactionListenerEntity';
import EntityManager from '../../../manager/EntityManager';
import ListenerCriterionCache from './ListenerCriterionCache';

@injectable()
export default class ReactionListenerManager extends EntityManager<ReactionListenerEntity> {
  private readonly cache = new ListenerCriterionCache<
    [
      messageId?: Snowflake,
      userId?: Snowflake,
      emojiId?: Snowflake | string,
      action?: ReactionAction
    ]
  >();

  private readonly userManager: UserManager;

  constructor(connection: Connection, eventHub: DatabaseEventHub, userManager: UserManager) {
    super(ReactionListenerEntity, connection);
    this.userManager = userManager;
    from(eventHub.listenTo<ReactionListenerEntity>(`sync_${this.repo.metadata.tableName}_DELETE`))
      .pipe(mergeAll())
      .subscribe(entity =>
        this.cache.remove(
          entity.cache,
          entity.message,
          entity.user || undefined,
          entity.emoji || undefined
        )
      );
  }

  async initialize(): Promise<void> {
    const listeners = await this.repo.find();
    listeners.forEach(listener =>
      this.cache.add(
        listener.cache,
        listener.message,
        listener.user || undefined,
        listener.emoji || undefined
      )
    );
  }

  private static resolveEmojiIdentifier(emoji: EmojiResolvable | string): string {
    if (typeof emoji === 'string') return emoji;
    return emoji.id ?? emoji.name;
  }

  private resolveParameters<TMessageOptional extends undefined>(
    message: MessageResolvable | TMessageOptional,
    user?: UserResolvable,
    emoji?: EmojiResolvable | string
  ) {
    return {
      messageId: message instanceof Message ? message.id : message,
      userId: user ? resolveIdChecked(this.userManager, user) : undefined,
      emojiId: emoji ? ReactionListenerManager.resolveEmojiIdentifier(emoji) : undefined,
    };
  }

  async addListener(
    cacheId: number,
    message: MessageResolvable,
    user?: UserResolvable,
    emoji?: EmojiResolvable | string,
    action?: ReactionAction
  ): Promise<void> {
    const {messageId, userId, emojiId} = this.resolveParameters<never>(message, user, emoji);
    await this.removeListener(cacheId, messageId, userId, emojiId, action);
    this.cache.add(cacheId, messageId, userId, emojiId, action);
    await this.repo.insert({
      message: messageId,
      user: userId ?? '',
      emoji: emojiId ?? '',
      action: toReactiveListenerActionFilter(action),
      cache: cacheId,
    });
  }

  async removeListener(
    cacheId: number,
    message?: MessageResolvable,
    user?: UserResolvable,
    emoji?: EmojiResolvable | string,
    action?: ReactionAction
  ): Promise<void> {
    const {messageId, userId, emojiId} = this.resolveParameters(message, user, emoji);
    this.cache.remove(cacheId, messageId, userId, emojiId, action);
    await this.repo.delete({
      cache: cacheId,
      message: messageId,
      user: userId,
      emoji: emojiId,
      action: action !== undefined ? toReactiveListenerActionFilter(action) : undefined,
    });
  }

  findCacheIds(reaction: MessageReaction, user: User, action: ReactionAction): number[] {
    return this.cache.find(
      reaction.message.id,
      user.id,
      ReactionListenerManager.resolveEmojiIdentifier(reaction.emoji),
      action
    );
  }
}
