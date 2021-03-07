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

export interface ParseHistoryEntry {
  name?: string;
  previousResult?: ParseResult;
  result: ParseResult;
}

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

  private _parseHistory: ParseHistoryEntry[] = [];

  get parseHistory(): ReadonlyArray<Readonly<ParseHistoryEntry>> {
    return this._parseHistory;
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
    const result = await parser(this.remainingContent);
    if (result) this.addParseResult(name, result);
    return result?.value;
  }

  protected addParseResult<TName extends keyof TParsedValues>(
    name: string | undefined,
    result: ParseResult<TParsedValues[TName]>
  ): void;
  protected addParseResult(name: string | undefined, result: ParseResult): void;
  protected addParseResult(name: string | undefined, result: ParseResult): void {
    this._parseIndex += result.length;
    if (!name) return;
    this._parseHistory.push({
      name,
      previousResult: this._parseResults[name],
      result,
    });
    this.setParseResult(name, result);
  }

  backtrackParse(stepCount = 1): ParseHistoryEntry[] {
    const rollbackHistory = this._parseHistory.splice(
      -Math.min(this.parseHistory.length, stepCount)
    );
    rollbackHistory.reverse().forEach(entry => {
      this._parseIndex -= entry.result.length;
      if (entry.name === undefined) return;
      if (!entry.previousResult) {
        delete this._values[entry.name];
        delete this._parseResults[entry.name];
        return;
      }
      this.setParseResult(entry.name, entry.previousResult);
    });
    return rollbackHistory;
  }

  clearHistory(): void {
    this._parseHistory = [];
  }

  private setParseResult(name: string, result: ParseResult): void {
    // @ts-expect-error index type is correct
    this._values[name] = result.value;
    // @ts-expect-error index type is correct
    this._parseResults[name] = result;
  }
}
