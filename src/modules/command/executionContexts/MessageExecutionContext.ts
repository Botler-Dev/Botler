import {Client, Message} from 'discord.js';
import {GlobalSettingsWrapper} from '@/settings';
import type {CommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import type {Command} from '../command/Command';
import {MessageSender} from '../message/MessageSender';
import {ParseResults, ParserEngine} from '../parser/ParserEngine';
import {GuildMemberContext} from './guild/GuildMemberContext';
import {UserExecutionContext} from './UserExecutionContext';

/**
 * {@link UserExecutionContext} that contains a {@link Message} and the corresponding {@link ParserEngine}.
 */
export abstract class MessageExecutionContext<
  TCommand extends Command<CommandCacheWrapper, TExistingParseResults>,
  TGuildContext extends GuildMemberContext | undefined,
  TCacheState extends ConcreteCommandCacheWrapper | undefined,
  TExistingParseResults extends ParseResults
> extends UserExecutionContext<TCommand, TGuildContext, TCacheState> {
  readonly message: Message;

  /**
   * {@link ParserEngine} for the {@link MessageExecutionContext.message} content.
   */
  readonly parser: ParserEngine<TExistingParseResults>;

  /**
   * {@link MessageSender} for the channel where {@link MessageExecutionContext.message} originated from.
   */
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
