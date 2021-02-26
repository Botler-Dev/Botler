import {MessageReaction} from 'discord.js';
import CommandCacheWrapper, {
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import UserWrapper from '../../../database/wrappers/UserWrapper';
import Command from '../command/Command';
import GuildMemberContext from './guild/GuildMemberContext';
import UserExecutionContext from './UserExecutionContext';

export default class ReactionExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TCommand extends Command = Command<TCache>
> extends UserExecutionContext<TCommand, TCache> {
  readonly reaction: MessageReaction;

  constructor(
    command: TCommand,
    cache: TCache,
    reaction: MessageReaction,
    user: UserWrapper,
    guild: GuildMemberContext | undefined
  ) {
    super(command, cache, user, guild);
    this.reaction = reaction;
  }
}
