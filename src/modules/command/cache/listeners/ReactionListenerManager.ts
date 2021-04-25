import {
  CommandReactionListener,
  CommandReactionListenerActionFilter,
  Prisma,
  PrismaClient,
} from '@prisma/client';
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
import DatabaseEventHub from '@/database/DatabaseEventHub';
import EntityManager from '@/database/manager/EntityManager';
import {resolveIdChecked} from '@/utils/resolve';
import {ReactionAction} from '../../executionContexts/ReactionExecutionContext';
import ListenerCriterionCache from './ListenerCriterionCache';

@injectable()
export default class ReactionListenerManager extends EntityManager<
  PrismaClient['commandReactionListener']
> {
  private readonly cache = new ListenerCriterionCache<
    [
      messageId?: Snowflake,
      userId?: Snowflake,
      emojiId?: Snowflake | string,
      action?: ReactionAction
    ]
  >();

  private readonly userManager: UserManager;

  constructor(prisma: PrismaClient, eventHub: DatabaseEventHub, userManager: UserManager) {
    super(prisma.commandReactionListener);
    this.userManager = userManager;
    from(
      eventHub.listenTo<CommandReactionListener>(
        `sync_${Prisma.ModelName.CommandReactionListener}_DELETE`
      )
    )
      .pipe(mergeAll())
      .subscribe(entity =>
        this.cache.remove(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          entity.cacheId!,
          entity.messageId,
          entity.userId || undefined,
          entity.emojiId || undefined,
          ReactionListenerManager.actionFilterToReactionAction(entity.action)
        )
      );
  }

  async initialize(): Promise<void> {
    const listeners = await this.model.findMany();
    listeners.forEach(listener =>
      this.cache.add(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        listener.cacheId!,
        listener.messageId,
        listener.userId || undefined,
        listener.emojiId || undefined,
        ReactionListenerManager.actionFilterToReactionAction(listener.action)
      )
    );
  }

  private static actionFilterToReactionAction(
    action: CommandReactionListenerActionFilter
  ): ReactionAction | undefined {
    switch (action) {
      case CommandReactionListenerActionFilter.Add:
        return ReactionAction.Add;
      case CommandReactionListenerActionFilter.Remove:
        return ReactionAction.Remove;
      default:
      case CommandReactionListenerActionFilter.Both:
        return undefined;
    }
  }

  private static reactionActionToActionFilter(
    action: ReactionAction | undefined
  ): CommandReactionListenerActionFilter {
    switch (action) {
      case ReactionAction.Add:
        return CommandReactionListenerActionFilter.Add;
      case ReactionAction.Remove:
        return CommandReactionListenerActionFilter.Remove;
      default:
      case undefined:
        return CommandReactionListenerActionFilter.Both;
    }
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
    await this.model.create({
      data: {
        messageId,
        userId: userId ?? '',
        emojiId: emojiId ?? '',
        action: ReactionListenerManager.reactionActionToActionFilter(action),
        cacheId,
      },
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
    await this.model.deleteMany({
      where: {
        cacheId,
        messageId,
        userId,
        emojiId,
        action:
          action !== undefined
            ? ReactionListenerManager.reactionActionToActionFilter(action)
            : undefined,
      },
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
