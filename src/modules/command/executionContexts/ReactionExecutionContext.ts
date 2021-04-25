import {GuildEmojiManager, MessageReaction, User} from 'discord.js';
import GlobalSettingsWrapper from '@/database/wrappers/GlobalSettingsWrapper';
import type CommandCacheWrapper from '../cache/CommandCacheWrapper';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import Command from '../command/Command';
import MessageSender from '../message/MessageSender';
import GuildMemberContext from './guild/GuildMemberContext';
import UserExecutionContext from './UserExecutionContext';

export enum ReactionAction {
  Add,
  Remove,
}

export default class ReactionExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TCommand extends Command = Command<TCache>,
  TGuildContext extends GuildMemberContext | undefined = GuildMemberContext | undefined
> extends UserExecutionContext<TCommand, TGuildContext, TCache> {
  readonly reaction: MessageReaction;

  readonly action: ReactionAction;

  readonly sender: MessageSender;

  constructor(
    globalSettings: GlobalSettingsWrapper,
    emojiManager: GuildEmojiManager,
    command: TCommand,
    cache: TCache,
    reaction: MessageReaction,
    action: ReactionAction,
    user: User,
    guild: TGuildContext
  ) {
    super(globalSettings, emojiManager, command, cache, user, guild);
    this.reaction = reaction;
    this.action = action;
    this.sender = this.createSender(reaction.message.channel);
  }
}
