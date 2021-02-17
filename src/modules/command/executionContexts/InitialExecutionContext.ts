import {Dayjs} from 'dayjs';
import {Message} from 'discord.js';
import type CommandCacheManager from '../../../database/managers/command/CommandCacheManager';
import CommandCacheWrapper, {
  CacheFromCommandCacheWrapper,
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import UserWrapper from '../../../database/wrappers/UserWrapper';
import type Command from '../command/Command';
import GuildMemberContext from './guild/GuildMemberContext';
import MessageExecutionContext, {ParsedValues} from './MessageExecutionContext';

export type InitialParsedValues = {
  prefix: string;
  command: Command;
};

export default class InitialExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TParsedValues extends ParsedValues = Record<string, never>,
  TCommand extends Command<TCache, ParsedValues> = Command<TCache, TParsedValues>
> extends MessageExecutionContext<
  TCommand,
  TCache | undefined,
  InitialParsedValues & TParsedValues
> {
  private readonly cacheManager: CommandCacheManager;

  constructor(
    command: TCommand,
    cacheManager: CommandCacheManager,
    message: Message,
    user: UserWrapper,
    guild: GuildMemberContext | undefined,
    prefix: string
  ) {
    super(command, undefined, message, user, guild);
    this.cacheManager = cacheManager;
    this.addParseResult('prefix', {
      value: prefix,
      length: prefix.length,
    });
    this.addParseResult('command', {
      value: command,
      length: command.name.length,
    });
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
