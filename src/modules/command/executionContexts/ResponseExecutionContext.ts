import {Message} from 'discord.js';
import CommandCacheWrapper, {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import Command from '../command/Command';
import ParserEngine, {ParseResults} from '../parser/ParserEngine';
import GuildMemberContext from './guild/GuildMemberContext';
import MessageExecutionContext from './MessageExecutionContext';

export default class ResponseExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TExistingParseResults extends ParseResults = Record<string, never>,
  TCommand extends Command<TCache, TExistingParseResults> = Command<TCache, TExistingParseResults>,
  TGuildContext extends GuildMemberContext | undefined = GuildMemberContext | undefined
> extends MessageExecutionContext<TCommand, TGuildContext, TCache, TExistingParseResults> {
  constructor(command: TCommand, cache: TCache, message: Message, guild: TGuildContext) {
    super(
      command,
      cache,
      message,
      new ParserEngine(message.content) as ParserEngine<TExistingParseResults>,
      guild
    );
  }
}
