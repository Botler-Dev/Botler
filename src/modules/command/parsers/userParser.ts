import UserManager from '../../../database/managers/UserManager';
import UserWrapper from '../../../database/wrappers/UserWrapper';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {
  generateDefaultOrNothing,
  ParseOptions,
  parseOptionsDefinition,
  Parser,
  ParseResult,
} from './parser';
import snowflakeParser, {SnowflakeType} from './snowflakeParser';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserParseOptions extends ParseOptions<UserWrapper> {
  // TODO: add name search support in guilds
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CleanUserParseOptions extends UserParseOptions {}

const userParseOptionsDefinition: OptionsCleanerDefinition<
  UserParseOptions,
  CleanUserParseOptions
> = {
  ...parseOptionsDefinition,
};

export type UserParseResult = ParseResult<UserWrapper>;

export function userParser(userManager: UserManager): Parser<UserWrapper, UserParseOptions> {
  return async (raw: string, options?: UserParseOptions): Promise<UserParseResult | undefined> => {
    const cleaned = cleanOptions(userParseOptionsDefinition, options ?? {});

    const snowflakeResult = await snowflakeParser(raw, {
      types: [SnowflakeType.Plain, SnowflakeType.User],
    });
    if (!snowflakeResult) return generateDefaultOrNothing(cleaned);
    try {
      const user = await userManager.fetch(snowflakeResult.value);
      return {
        value: user,
        length: snowflakeResult.length,
      };
    } catch {
      return generateDefaultOrNothing(cleaned);
    }
  };
}
