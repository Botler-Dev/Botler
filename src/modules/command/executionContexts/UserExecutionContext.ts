import {Client, User} from 'discord.js';
import {GlobalSettingsWrapper} from '@/settings';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type {Command} from '../command/Command';
import {BaseExecutionContext} from './BaseExecutionContext';
import {GuildMemberContext} from './guild/GuildMemberContext';

/**
 * {@link BaseExecutionContext} for a specific {@link User} and, if available, the corresponding {@link GuildMember}.
 */
export class UserExecutionContext<
  TCommand extends Command,
  TGuildContext extends GuildMemberContext | undefined,
  TCacheState extends ConcreteCommandCacheWrapper | undefined
> extends BaseExecutionContext<TCommand, TGuildContext, TCacheState> {
  user: User;

  constructor(
    globalSettings: GlobalSettingsWrapper,
    client: Client,
    command: TCommand,
    cache: TCacheState,
    user: User,
    guild: TGuildContext
  ) {
    super(globalSettings, client, command, cache, guild);
    this.user = user;
  }
}
