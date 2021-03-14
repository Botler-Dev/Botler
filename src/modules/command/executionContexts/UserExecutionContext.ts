import {User} from 'discord.js';
import {ConcreteCommandCacheWrapper} from '../../../database/wrappers/command/CommandCacheWrapper';
import type Command from '../command/Command';
import BaseExecutionContext from './BaseExecutionContext';
import GuildMemberContext from './guild/GuildMemberContext';

export default class UserExecutionContext<
  TCommand extends Command,
  TCacheState extends ConcreteCommandCacheWrapper | undefined
> extends BaseExecutionContext<TCommand, TCacheState> {
  user: User;

  constructor(
    command: TCommand,
    cache: TCacheState,
    user: User,
    guild: GuildMemberContext | undefined
  ) {
    super(command, cache, guild);
    this.user = user;
  }
}
