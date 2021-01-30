import {optional} from '../../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {ParseOptions, parseOptionsDefinition, Parser, ParseResult, parseTrimStart} from './parser';

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

interface CleanStringParseOptions extends StringParseOptions {
  whitespaceStopper: boolean;
  quotesAsLimiters: boolean;
  disallowEmpty: boolean;
}

const stringParseOptionsDefinition: OptionsCleanerDefinition<
  StringParseOptions,
  CleanStringParseOptions
> = {
  ...parseOptionsDefinition,
  whitespaceStopper: optional(false),
  quotesAsLimiters: optional(false),
  disallowEmpty: optional(true),
};

export type StringParseResult = ParseResult<string>;

function innerParser(raw: string, options: CleanStringParseOptions): StringParseResult {
  if (!options.quotesAsLimiters) {
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

export default function stringParser(options?: StringParseOptions): Parser<string> {
  const cleaned = cleanOptions(stringParseOptionsDefinition, options ?? {});
  return async (raw: string): Promise<StringParseResult | undefined> => {
    const trimmed = parseTrimStart(raw);
    const {value, length} = innerParser(trimmed.value, cleaned);
    if (cleaned.disallowEmpty && value.length === 0 && cleaned.default === undefined)
      return undefined;
    return {
      value: (value || cleaned?.default) ?? '',
      length: trimmed.length + length,
    };
  };
}
