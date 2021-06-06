import {Client, Message} from 'discord.js';
import {GlobalSettingsWrapper} from '@/settings';
import {ConcreteCommandCacheWrapper, CommandCacheWrapper} from '../cache/CommandCacheWrapper';
import {Command} from '../command/Command';
import {ParseResults, ParserEngine} from '../parser/ParserEngine';
import {GuildMemberContext} from './guild/GuildMemberContext';
import {MessageExecutionContext} from './MessageExecutionContext';

export class ResponseExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TExistingParseResults extends ParseResults = Record<string, never>,
  TCommand extends Command<TCache, TExistingParseResults> = Command<TCache, TExistingParseResults>,
  TGuildContext extends GuildMemberContext | undefined = GuildMemberContext | undefined
> extends MessageExecutionContext<TCommand, TGuildContext, TCache, TExistingParseResults> {
  constructor(
    globalSettings: GlobalSettingsWrapper,
    client: Client,
    command: TCommand,
    cache: TCache,
    message: Message,
    guild: TGuildContext
  ) {
    super(
      globalSettings,
      client,
      command,
      cache,
      message,
      new ParserEngine(message.content) as ParserEngine<TExistingParseResults>,
      guild
    );
  }
}
