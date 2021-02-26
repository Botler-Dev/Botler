import {Message} from 'discord.js';
import CommandCacheWrapper, {
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import UserWrapper from '../../../database/wrappers/UserWrapper';
import type Command from '../command/Command';
import MissingParameterError from '../errors/MissingParameterError';
import {Parser, ParseResult} from '../parsers/parser';
import GuildMemberContext from './guild/GuildMemberContext';
import UserExecutionContext from './UserExecutionContext';

export type ParsedValues = Record<string, unknown>;

export type ParseResults<TValues extends ParsedValues = ParsedValues> = {
  [name in keyof TValues]: ParseResult<TValues[name]>;
};

export default abstract class MessageExecutionContext<
  TCommand extends Command<CommandCacheWrapper, ParsedValues>,
  TCacheState extends ConcreteCommandCacheWrapper | undefined,
  TParsedValues extends ParsedValues
> extends UserExecutionContext<TCommand, TCacheState> {
  readonly message: Message;

  private readonly _values = {} as TParsedValues & ParsedValues;

  get values(): Readonly<TParsedValues & ParsedValues> {
    return this._values;
  }

  private readonly _parseResults = {} as ParseResults<TParsedValues & ParsedValues>;

  get parseResults(): Readonly<ParseResults<TParsedValues & ParsedValues>> {
    return this._parseResults;
  }

  private _parseIndex = 0;

  get parseIndex(): number {
    return this._parseIndex;
  }

  get remainingContent(): string {
    return this.message.content.slice(this.parseIndex);
  }

  constructor(
    command: TCommand,
    cache: TCacheState,
    message: Message,
    user: UserWrapper,
    guild: GuildMemberContext | undefined
  ) {
    super(command, cache, user, guild);
    this.message = message;
  }

  async parseNext<TValue>(parser: Parser<TValue>, name?: string): Promise<TValue> {
    const result = await parser(this.remainingContent);
    if (result === undefined) throw new MissingParameterError(this.message.channel, name);
    this.addParseResult(name, result);
    return result.value;
  }

  async parseOptionalNext<TValue>(
    parser: Parser<TValue>,
    name?: string
  ): Promise<TValue | undefined> {
    const result = (await parser(this.remainingContent)) ?? {value: undefined, length: 0};
    this.addParseResult(name, result);
    return result.value;
  }

  protected addParseResult<TName extends keyof TParsedValues>(
    name: string | undefined,
    result: ParseResult<TParsedValues[TName]>
  ): void;
  protected addParseResult(name: string | undefined, result: ParseResult): void;
  protected addParseResult(name: string | undefined, result: ParseResult): void {
    this._parseIndex += result.length;
    if (!name) return;
    // @ts-expect-error index type is correct
    this._values[name] = result.value;
    // @ts-expect-error index type is correct
    this._parseResults[name] = result;
  }
}
