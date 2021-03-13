import {Message} from 'discord.js';
import CommandCacheWrapper, {
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import UserWrapper from '../../../database/wrappers/UserWrapper';
import type Command from '../command/Command';
import ParserEngine, {ParseResults} from '../parser/ParserEngine';
import GuildMemberContext from './guild/GuildMemberContext';
import UserExecutionContext from './UserExecutionContext';

export default abstract class MessageExecutionContext<
  TCommand extends Command<CommandCacheWrapper, TExistingParseResults>,
  TCacheState extends ConcreteCommandCacheWrapper | undefined,
  TExistingParseResults extends ParseResults
> extends UserExecutionContext<TCommand, TCacheState> {
  readonly message: Message;

  readonly parser: ParserEngine<TExistingParseResults>;

  constructor(
    command: TCommand,
    cache: TCacheState,
    message: Message,
    parser: ParserEngine<TExistingParseResults>,
    user: UserWrapper,
    guild: GuildMemberContext | undefined
  ) {
    super(command, cache, user, guild);
    this.message = message;
    this.parser = parser;
  }
}
