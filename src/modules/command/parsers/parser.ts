export type ParseOptions<TValue = unknown> = {
  default?: TValue;
};

export type ParseResult<TValue = unknown> = {
  value: TValue;
  length: number;
};

export type Parser<TValue = unknown> = (
  raw: string,
  options?: ParseOptions<TValue>
) => Promise<ParseResult<TValue> | undefined>;
