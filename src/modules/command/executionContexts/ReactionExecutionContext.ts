import {MessageReaction, User} from 'discord.js';
import CommandCacheWrapper, {
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import Command from '../command/Command';
import GuildMemberContext from './guild/GuildMemberContext';
import UserExecutionContext from './UserExecutionContext';

export enum ReactionAction {
  Add,
  Remove,
}

export default class ReactionExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TCommand extends Command = Command<TCache>
> extends UserExecutionContext<TCommand, TCache> {
  readonly reaction: MessageReaction;

  readonly action: ReactionAction;

  constructor(
    command: TCommand,
    cache: TCache,
    reaction: MessageReaction,
    action: ReactionAction,
    user: User,
    guild: GuildMemberContext | undefined
  ) {
    super(command, cache, user, guild);
    this.reaction = reaction;
    this.action = action;
  }
}
