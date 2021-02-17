import {EmojiResolvable, Message, MessageReaction, MessageResolvable, User} from 'discord.js';
import {injectable} from 'tsyringe';
import {Connection, FindConditions} from 'typeorm';
import ReactionListenerEntity from '../../entities/command/ReactionListenerEntity';
import WrapperManager from '../../manager/WrapperManager';
import {UserWrapperResolvable} from '../../wrappers/UserWrapper';
import UserManager from '../UserManager';

@injectable()
export default class ReactionListenerManager extends WrapperManager<ReactionListenerEntity> {
  private readonly userManager: UserManager;

  constructor(connection: Connection, userManager: UserManager) {
    super(ReactionListenerEntity, connection);
    this.userManager = userManager;
  }

  private static resolveEmojiIdentifier(emoji: EmojiResolvable | string): string {
    if (typeof emoji === 'string') return emoji;
    return emoji.id ?? emoji.name;
  }

  async addListener(
    cacheId: number,
    message: MessageResolvable,
    user?: UserWrapperResolvable,
    emoji?: EmojiResolvable | string
  ): Promise<void> {
    await this.removeListener(cacheId, message, user, emoji);
    await this.repo.insert({
      message: message instanceof Message ? message.id : message,
      user: user === undefined ? '' : this.userManager.resolveIdChecked(user),
      emoji: emoji === undefined ? '' : ReactionListenerManager.resolveEmojiIdentifier(emoji),
      cache: cacheId,
    });
  }

  async removeListener(
    cacheId: number,
    message?: MessageResolvable,
    user?: UserWrapperResolvable,
    emoji?: EmojiResolvable | string
  ): Promise<void> {
    const conditions: FindConditions<ReactionListenerEntity> = {
      cache: cacheId,
    };
    if (message) conditions.message = message instanceof Message ? message.id : message;
    if (user) conditions.user = this.userManager.resolveIdChecked(user);
    if (emoji) conditions.emoji = ReactionListenerManager.resolveEmojiIdentifier(emoji);
    await this.repo.delete(conditions);
  }

  async findCacheIds(reaction: MessageReaction, user: User): Promise<number[]> {
    const userIds = ['', user.id];
    const emojiIds = ['', ReactionListenerManager.resolveEmojiIdentifier(reaction.emoji)];
    const possibleCombinations = userIds.flatMap(userId =>
      emojiIds.map(emojiId => [userId, emojiId] as const)
    );

    const result = await this.repo.find({
      where: possibleCombinations.map(([userId, emojiId]) => ({
        message: reaction.message.id,
        user: userId,
        emoji: emojiId,
      })),
    });
    return result.map(entity => entity.cache);
  }
}
