/**
 * Output of a successful {@link Parser} parse.
 */
export interface ParseResult<TValue = unknown> {
  /**
   * Parsed value.
   */
  readonly value: TValue;
  /**
   * Length of the string from the beginning used to compute the value.
   *
   * Also needs to include all trailing spaces after that section so the next parser's input does not have prefixing spaces.
   */
  readonly length: number;
}

export type ValueFromParseResult<TResult extends ParseResult = ParseResult> =
  TResult extends ParseResult<infer TValue> ? TValue : never;

/**
 * Message parser for commands.
 *
 * It only parses the start of strings and figures out how much of the rest is also part of the parsed value.
 * Meaning if the value is not at the beginning (without prefixing spaces) the value will not be found.
 *
 * @param raw The remaining unparsed part of the message
 */
export type Parser<TResult extends ParseResult = ParseResult> = (
  raw: string
) => Promise<TResult | undefined>;
