import {optional} from '@/utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '@/utils/optionsCleaner';
import {Parser, ParseResult} from '../parser/parser';

export interface StringParseOptions {
  /**
   * If whitespace should be interpreted as a stop. (default `true`)
   */
  whitespaceStopper?: boolean;
  /**
   * If `"` should be interpreted as limiters if present.
   * Will overwrite `whitespaceStopper` in that case. (default `true`)
   */
  quotesAsLimiters?: boolean;
  /**
   * If no result should be returned when value is empty. (default `true`)
   */
  disallowEmpty?: boolean;
}

interface CleanStringParseOptions extends StringParseOptions {
  whitespaceStopper: boolean;
  quotesAsLimiters: boolean;
  disallowEmpty: boolean;
}

const stringParseOptionsDefinition: OptionsCleanerDefinition<
  StringParseOptions,
  CleanStringParseOptions
> = {
  whitespaceStopper: optional(true),
  quotesAsLimiters: optional(true),
  disallowEmpty: optional(true),
};

export type StringParseResult = ParseResult<string>;

function parseValue(raw: string, options: CleanStringParseOptions): StringParseResult {
  if (options.quotesAsLimiters) {
    const result = raw.match(/^"(.*?[^\\])"(?:\s+|$)/);
    if (result)
      return {
        value: result[1],
        length: result[0].length,
      };
  }
  if (options.whitespaceStopper) {
    const [value, rest] = raw.split(/\s+(.*)/) as [string, string | undefined];
    return {
      value,
      length: raw.length - (rest?.length ?? 0),
    };
  }
  return {
    value: raw.trimEnd(),
    length: raw.length,
  };
}

export default function stringParser(options?: StringParseOptions): Parser<StringParseResult> {
  const cleaned = cleanOptions(stringParseOptionsDefinition, options ?? {});
  return async (raw: string): Promise<StringParseResult | undefined> => {
    const result = parseValue(raw, cleaned);
    if (cleaned.disallowEmpty && result.length === 0) return undefined;
    return result;
  };
}
