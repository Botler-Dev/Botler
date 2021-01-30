import {Message} from 'discord.js';
import GuildWrapper from '../../../database/wrappers/GuildWrapper';
import UserWrapper from '../../../database/wrappers/UserWrapper';
import {Parser, ParseResult} from '../parsers/parser';
import UserExecutionContext from './UserExecutionContext';

export type ParsedValues = Record<string, unknown>;

export type ParseResults<TValues extends ParsedValues = ParsedValues> = {
  [name in keyof TValues]: ParseResult<TValues[name]>;
};

export default abstract class MessageExecutionContext<
  TExistingValues extends ParsedValues = Record<string, never>
> extends UserExecutionContext {
  readonly message: Message;

  private readonly _values = {} as TExistingValues & ParsedValues;

  get values(): Readonly<TExistingValues & ParsedValues> {
    return this._values;
  }

  private readonly _parseResults = {} as ParseResults<TExistingValues & ParsedValues>;

  get parseResults(): Readonly<ParseResults<TExistingValues & ParsedValues>> {
    return this._parseResults;
  }

  private _parseIndex = 0;

  get parseIndex(): number {
    return this._parseIndex;
  }

  get remainingContent(): string {
    return this.message.content.slice(this.parseIndex);
  }

  constructor(message: Message, user: UserWrapper, guild: GuildWrapper | undefined) {
    super(user, guild);
    this.message = message;
  }

  async parseNext<TValue>(parser: Parser<TValue>, name?: string): Promise<TValue> {
    const result = await parser(this.remainingContent);
    if (result === undefined) throw new Error(`Failed to parse value called "${name}".`);
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

  protected addParseResult<TName extends keyof TExistingValues>(
    name: string | undefined,
    result: ParseResult<TExistingValues[TName]>
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
