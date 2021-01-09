import {optional} from '../../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {
  generateDefaultOrNothing,
  ParseOptions,
  parseOptionsDefinition,
  Parser,
  ParseResult,
} from './parser';

export interface StringParseOptions extends ParseOptions<string> {
  /**
   * If whitespace should be interpreted as a stop. (default `false`)
   */
  spaceStopper?: boolean;
}

export interface CleanedStringParseOptions extends ParseOptions<string> {
  spaceStopper: boolean;
}

export const stringParseOptionsDefinition: OptionsCleanerDefinition<
  StringParseOptions,
  CleanedStringParseOptions
> = {
  ...parseOptionsDefinition,
  spaceStopper: optional(false),
};

const stringParser: Parser<string, StringParseOptions> = async (
  raw: string,
  options?: StringParseOptions
): Promise<ParseResult<string> | undefined> => {
  const cleaned = cleanOptions(stringParseOptionsDefinition, options ?? {});
  let value: string;
  let length: number;
  if (!cleaned.spaceStopper) {
    value = raw.trim();
    length = raw.length;
  } else {
    const [valueSection, rest] = raw.trimStart().split(/\s/, 2) as [string, string | undefined];
    value = valueSection;
    length = raw.length - (rest?.length ?? 0);
  }

  if (value.length === 0) return generateDefaultOrNothing(cleaned);
  return {
    value,
    length,
  };
};

export default stringParser;
