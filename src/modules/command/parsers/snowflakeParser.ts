import {Snowflake} from 'discord.js';
import {notEmpty, optional, stack} from '@/utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '@/utils/optionsCleaner';
import {Parser, ParseResult} from '../parser/parser';

export enum SnowflakeType {
  Plain,
  User,
  Channel,
  Role,
}

export interface SnowflakeParseOptions {
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

export default function snowflakeParser(
  options?: SnowflakeParseOptions
): Parser<SnowflakeParseResult> {
  const cleaned = cleanOptions(snowflakeParseOptionsDefinition, options ?? {});
  return async (raw: string): Promise<SnowflakeParseResult | undefined> => {
    let result: ParseResult<string> | undefined;
    cleaned.types.some(type => {
      const match = raw.match(REGEXP_PATTERNS[type]);
      if (!match) return false;
      result = {
        value: match[1],
        length: match[0].length,
      };
      return true;
    });
    return result;
  };
}
