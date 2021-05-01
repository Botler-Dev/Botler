import {Client, Message} from 'discord.js';
import GlobalSettingsWrapper from '@/database/wrappers/GlobalSettingsWrapper';
import type CommandCacheWrapper from '../cache/CommandCacheWrapper';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type Command from '../command/Command';
import MessageSender from '../message/MessageSender';
import ParserEngine, {ParseResults} from '../parser/ParserEngine';
import GuildMemberContext from './guild/GuildMemberContext';
import UserExecutionContext from './UserExecutionContext';

export default abstract class MessageExecutionContext<
  TCommand extends Command<CommandCacheWrapper, TExistingParseResults>,
  TGuildContext extends GuildMemberContext | undefined,
  TCacheState extends ConcreteCommandCacheWrapper | undefined,
  TExistingParseResults extends ParseResults
> extends UserExecutionContext<TCommand, TGuildContext, TCacheState> {
  readonly message: Message;

  readonly parser: ParserEngine<TExistingParseResults>;

  readonly sender: MessageSender;

  constructor(
    globalSettings: GlobalSettingsWrapper,
    client: Client,
    command: TCommand,
    cache: TCacheState,
    message: Message,
    parser: ParserEngine<TExistingParseResults>,
    guild: TGuildContext
  ) {
    super(globalSettings, client, command, cache, message.author, guild);
    this.message = message;
    this.parser = parser;
    this.sender = this.createSender(message.channel);
  }
}
