import {Dayjs} from 'dayjs';
import {Message} from 'discord.js';
import type CommandCacheManager from '../cache/CommandCacheManager';
import type CommandCacheWrapper from '../cache/CommandCacheWrapper';
import type {
  CacheFromCommandCacheWrapper,
  ConcreteCommandCacheWrapper,
} from '../cache/CommandCacheWrapper';
import type Command from '../command/Command';
import {ParseResult} from '../parser/parser';
import ParserEngine, {EmptyParseResults, ParseResults} from '../parser/ParserEngine';
import GuildMemberContext from './guild/GuildMemberContext';
import MessageExecutionContext from './MessageExecutionContext';

export type InitialParsedValues = {
  prefix: ParseResult<string>;
  command: ParseResult<Command>;
};

export default class InitialExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TExistingParseResults extends ParseResults = EmptyParseResults,
  TCommand extends Command<TCache, TExistingParseResults> = Command<TCache, TExistingParseResults>,
  TGuildContext extends GuildMemberContext | undefined = GuildMemberContext | undefined
> extends MessageExecutionContext<
  TCommand,
  TGuildContext,
  TCache | undefined,
  InitialParsedValues & TExistingParseResults
> {
  private readonly cacheManager: CommandCacheManager;

  constructor(
    command: TCommand,
    cacheManager: CommandCacheManager,
    message: Message,
    parser: ParserEngine<InitialParsedValues & TExistingParseResults>,
    guild: TGuildContext
  ) {
    super(command, undefined, message, parser, guild);
    this.cacheManager = cacheManager;
  }

  async createCache(
    expirationDateTime: Dayjs,
    cache: CacheFromCommandCacheWrapper<TCache>
  ): Promise<TCache> {
    const wrapper = await this.cacheManager.createCache(this.command, expirationDateTime, cache);
    this.setCache(wrapper);
    return wrapper;
  }
}
