import {User} from 'discord.js';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type Command from '../command/Command';
import BaseExecutionContext from './BaseExecutionContext';
import GuildMemberContext from './guild/GuildMemberContext';

export default class UserExecutionContext<
  TCommand extends Command,
  TGuildContext extends GuildMemberContext | undefined,
  TCacheState extends ConcreteCommandCacheWrapper | undefined
> extends BaseExecutionContext<TCommand, TGuildContext, TCacheState> {
  user: User;

  constructor(command: TCommand, cache: TCacheState, user: User, guild: TGuildContext) {
    super(command, cache, guild);
    this.user = user;
  }
}
