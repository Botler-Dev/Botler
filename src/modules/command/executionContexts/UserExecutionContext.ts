import {ConcreteCommandCacheWrapper} from '../../../database/wrappers/command/CommandCacheWrapper';
import UserWrapper from '../../../database/wrappers/UserWrapper';
import type Command from '../command/Command';
import BaseExecutionContext from './BaseExecutionContext';
import GuildMemberContext from './guild/GuildMemberContext';

export default class UserExecutionContext<
  TCommand extends Command,
  TCacheState extends ConcreteCommandCacheWrapper | undefined
> extends BaseExecutionContext<TCommand, TCacheState> {
  user: UserWrapper;

  constructor(
    command: TCommand,
    cache: TCacheState,
    user: UserWrapper,
    guild: GuildMemberContext | undefined
  ) {
    super(command, cache, guild);
    this.user = user;
  }
}
