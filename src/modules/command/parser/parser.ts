export interface ParseResult<TValue = unknown> {
  readonly value: TValue;
  readonly length: number;
}

export type ValueFromParseResult<TResult extends ParseResult = ParseResult> =
  TResult extends ParseResult<infer TValue> ? TValue : never;

export type Parser<TResult extends ParseResult = ParseResult> = (
  raw: string
) => Promise<TResult | undefined>;
