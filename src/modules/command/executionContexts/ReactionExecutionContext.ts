import {MessageReaction, User} from 'discord.js';
import type CommandCacheWrapper from '../cache/CommandCacheWrapper';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import Command from '../command/Command';
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

  constructor(
    command: TCommand,
    cache: TCache,
    reaction: MessageReaction,
    action: ReactionAction,
    user: User,
    guild: TGuildContext
  ) {
    super(command, cache, user, guild);
    this.reaction = reaction;
    this.action = action;
  }
}
