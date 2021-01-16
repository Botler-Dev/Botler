import {Snowflake} from 'discord.js';
import {notEmpty, optional, stack} from '../../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {
  generateDefaultOrNothing,
  ParseOptions,
  parseOptionsDefinition,
  Parser,
  ParseResult,
  parseTrimStart,
} from './parser';

export enum SnowflakeType {
  Plain,
  User,
  Channel,
  Role,
}

export interface SnowflakeParseOptions extends ParseOptions<Snowflake> {
  /**
   * What snowflake definition types should be parsed. (default all)
   */
  types?: SnowflakeType[];
}

interface CleanSnowflakeParseOptions extends SnowflakeParseOptions {
  types: SnowflakeType[];
}

const snowflakeParseOptionsDefinition: OptionsCleanerDefinition<
  SnowflakeParseOptions,
  CleanSnowflakeParseOptions
> = {
  ...parseOptionsDefinition,
  types: stack(
    optional([SnowflakeType.Plain, SnowflakeType.User, SnowflakeType.Channel, SnowflakeType.Role]),
    notEmpty()
  ),
};

export type SnowflakeParseResult = ParseResult<Snowflake>;

const REGEXP_PATTERNS = {
  [SnowflakeType.Plain]: /^(\d{17,19})(?:\s+|$)/,
  [SnowflakeType.User]: /^<@!?(\d{17,19})>(?:\s+|$)/,
  [SnowflakeType.Channel]: /^<#(\d{17,19})>(?:\s+|$)/,
  [SnowflakeType.Role]: /^<@&(\d{17,19})>(?:\s+|$)/,
} as const;

const snowflakeParser: Parser<Snowflake, SnowflakeParseOptions> = async (
  raw: string,
  options?: SnowflakeParseOptions
): Promise<SnowflakeParseResult | undefined> => {
  const cleaned = cleanOptions(snowflakeParseOptionsDefinition, options ?? {});
  const trimmed = parseTrimStart(raw);

  let result: ParseResult<string> | undefined;
  cleaned.types.some(type => {
    const match = trimmed.value.match(REGEXP_PATTERNS[type]);
    if (!match) return false;
    result = {
      value: match[1],
      length: trimmed.length + match[0].length,
    };
    return true;
  });

  if (result) return result;
  return generateDefaultOrNothing(cleaned);
};

export default snowflakeParser;
