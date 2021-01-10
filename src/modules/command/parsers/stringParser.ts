import {optional} from '../../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {ParseOptions, parseOptionsDefinition, Parser, ParseResult} from './parser';

export interface StringParseOptions extends ParseOptions<string> {
  /**
   * Default value incase parsed value is empty. (default `undefined`)
   */
  default?: string;
  /**
   * If whitespace should be interpreted as a stop. (default `false`)
   */
  whitespaceStopper?: boolean;
  /**
   * If `"` should be interpreted as limiters if present.
   * Will overwrite `whitespaceStopper` in that case. (default `false`)
   */
  quotesAsLimiters?: boolean;
  /**
   * If no result should be returned when value is empty. (default `true`)
   */
  disallowEmpty?: boolean;
}

export interface CleanedStringParseOptions extends ParseOptions<string> {
  whitespaceStopper: boolean;
  quotesAsLimiters: boolean;
  disallowEmpty: boolean;
}

export const stringParseOptionsDefinition: OptionsCleanerDefinition<
  StringParseOptions,
  CleanedStringParseOptions
> = {
  ...parseOptionsDefinition,
  whitespaceStopper: optional(false),
  quotesAsLimiters: optional(false),
  disallowEmpty: optional(true),
};

export type StringParseResult = ParseResult<string>;

function innerParser(raw: string, options: CleanedStringParseOptions): StringParseResult {
  if (!options.quotesAsLimiters) {
    const result = raw.match(/^"(.*?[^\\])"(?:\s|$)/);
    if (result)
      return {
        value: result[1],
        length: result[0].length,
      };
  }
  if (options.whitespaceStopper) {
    const [value, rest] = raw.split(/\s+/, 2) as [string, string | undefined];
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

const stringParser: Parser<string, StringParseOptions> = async (
  raw: string,
  options?: StringParseOptions
): Promise<StringParseResult | undefined> => {
  const cleaned = cleanOptions(stringParseOptionsDefinition, options ?? {});
  const trimmed = raw.trimStart();
  const trimmedLength = raw.length - trimmed.length;
  const {value, length} = innerParser(trimmed, cleaned);
  if (cleaned.disallowEmpty && value.length === 0 && cleaned.default === undefined)
    return undefined;
  return {
    value: (value || cleaned?.default) ?? '',
    length: trimmedLength + length,
  };
};

export default stringParser;
