import {Dayjs} from 'dayjs';
import {Message} from 'discord.js';
import type CommandCacheManager from '../../../database/managers/command/CommandCacheManager';
import CommandCacheWrapper, {
  CacheFromCommandCacheWrapper,
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import UserWrapper from '../../../database/wrappers/UserWrapper';
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
  TCommand extends Command<TCache, TExistingParseResults> = Command<TCache, TExistingParseResults>
> extends MessageExecutionContext<
  TCommand,
  TCache | undefined,
  InitialParsedValues & TExistingParseResults
> {
  private readonly cacheManager: CommandCacheManager;

  constructor(
    command: TCommand,
    cacheManager: CommandCacheManager,
    message: Message,
    parser: ParserEngine<InitialParsedValues & TExistingParseResults>,
    user: UserWrapper,
    guild: GuildMemberContext | undefined
  ) {
    super(command, undefined, message, parser, user, guild);
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
