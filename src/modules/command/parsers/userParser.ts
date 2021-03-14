import {User, UserManager} from 'discord.js';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {Parser, ParseResult} from '../parser/parser';
import snowflakeParser, {SnowflakeType} from './snowflakeParser';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserParseOptions {
  // TODO: add name search support in guilds
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CleanUserParseOptions extends UserParseOptions {}

const userParseOptionsDefinition: OptionsCleanerDefinition<
  UserParseOptions,
  CleanUserParseOptions
> = {};

export type UserParseResult = ParseResult<User>;

export function userParser(
  userManager: UserManager,
  options?: UserParseOptions
): Parser<UserParseResult> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleaned = cleanOptions(userParseOptionsDefinition, options ?? {});
  return async (raw: string): Promise<UserParseResult | undefined> => {
    const snowflakeResult = await snowflakeParser({
      types: [SnowflakeType.Plain, SnowflakeType.User],
    })(raw);
    if (!snowflakeResult) return undefined;
    try {
      const user = await userManager.fetch(snowflakeResult.value);
      return {
        value: user,
        length: snowflakeResult.length,
      };
    } catch {
      return undefined;
    }
  };
}
