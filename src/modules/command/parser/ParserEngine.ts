import {Parser, ParseResult, ValueFromParseResult} from './parser';

export type ParseResults = Record<string, ParseResult>;

export type EmptyParseResults = Record<never, never>;

type RealParseResults<TResults extends ParseResults> = TResults &
  Record<string, ParseResult | undefined>;

export type ParsedValues<TResults extends ParseResults = EmptyParseResults> = {
  [name in keyof TResults]: ValueFromParseResult<TResults[name]>;
};

export interface ParseHistoryEntry {
  readonly name?: string;
  readonly overwrittenResult?: ParseResult;
  readonly result: ParseResult;
}

/**
 * Handles the entire parsing of a message.
 */
export class ParserEngine<TExistingResults extends ParseResults = EmptyParseResults> {
  readonly raw: string;

  private readonly _results = {} as RealParseResults<TExistingResults>;

  /**
   * Parse results mapped using the provided `name`.
   */
  get results(): Readonly<RealParseResults<TExistingResults>> {
    return this._results;
  }

  private readonly _values = {} as ParsedValues<RealParseResults<TExistingResults>>;

  /**
   * Parse result values mapped using the provided `name`.
   */
  get values(): Readonly<ParsedValues<RealParseResults<TExistingResults>>> {
    return this._values;
  }

  private readonly _history: ParseHistoryEntry[] = [];

  /**
   * History of the previous parse operations.
   */
  get history(): ReadonlyArray<ParseHistoryEntry> {
    return this._history;
  }

  private _index = 0;

  /**
   * Current char index of {@link this.raw} the next parser will start at.
   */
  get index(): number {
    return this._index;
  }

  /**
   * Remaining unparsed section of {@link this.raw}.
   */
  get remain(): string {
    return this.raw.slice(this.index);
  }

  constructor(raw: string, existingResults?: TExistingResults) {
    this.raw = raw;

    if (!existingResults) return;
    Object.entries(existingResults).forEach(([name, result]) => this.addParseResult(name, result));
  }

  /**
   * Executes the provided parser.
   *
   * @param name Name to use for the {@link this.results} and {@link this.values} mapping.
   * @returns The result if the parsing was successful.
   */
  async next<TResult extends ParseResult>(
    parser: Parser<TResult>,
    name?: string
  ): Promise<TResult | undefined> {
    const result = await parser(this.remain);
    if (result) this.addParseResult(name, result);
    return result;
  }

  /**
   * Executes the provided parser.
   *
   * @param name Name to use for the {@link this.results} and {@link this.values} mapping.
   * @returns The result value if the parsing was successful.
   */
  async nextValue<TResult extends ParseResult>(
    parser: Parser<TResult>,
    name?: string
  ): Promise<TResult['value'] | undefined> {
    return (await this.next(parser, name))?.value;
  }

  protected addParseResult<TName extends keyof TExistingResults>(
    name: TName,
    result: Exclude<TExistingResults[TName], undefined>
  ): void;
  protected addParseResult(name: string | undefined, result: ParseResult): void;
  protected addParseResult(name: string | undefined, result: ParseResult): void {
    this._index += result.length;
    this._history.push({
      name,
      overwrittenResult: name ? this._results[name] : undefined,
      result,
    });
    if (!name) return;
    this.setParseResult(name, result);
  }

  private setParseResult(name: string, result: ParseResult): void {
    this._values[name as keyof TExistingResults] = result.value as ValueFromParseResult<
      TExistingResults[keyof TExistingResults]
    >;
    this._results[name as keyof TExistingResults] =
      result as TExistingResults[keyof TExistingResults];
  }

  /**
   * Reverts parse operations to return the engine to its previous state.
   *
   * @param stepCount How many operations to revert. (default `1`)
   */
  rollback(stepCount = 1): ParseHistoryEntry[] {
    const rollbackHistory = this._history.splice(-Math.min(this.history.length, stepCount));
    rollbackHistory.reverse().forEach(entry => {
      this._index -= entry.result.length;
      if (entry.name === undefined) return;
      if (!entry.overwrittenResult) {
        delete this._values[entry.name];
        delete this._results[entry.name];
        return;
      }
      this.setParseResult(entry.name, entry.overwrittenResult);
    });
    return rollbackHistory;
  }

  /**
   * Delete all history.
   * Will not reverse any operations but will make them irreversible.
   */
  clearHistory(): void {
    this._history.splice(0);
  }
}
