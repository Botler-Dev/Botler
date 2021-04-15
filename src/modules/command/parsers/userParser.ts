import {GuildMemberManager, User, UserManager} from 'discord.js';
import {unchecked} from '../../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {Parser, ParseResult} from '../parser/parser';
import {guildMemberParser, GuildMemberParserOptions} from './guildMemberParser';
import snowflakeParser, {SnowflakeType} from './snowflakeParser';

export interface UserParseOptions
  extends Pick<
    GuildMemberParserOptions,
    | 'searchUsername'
    | 'searchNickname'
    | 'nameParseOptions'
    | 'allowSimilar'
    | 'similarityThreshold'
  > {
  /**
   * Members to search in by nickname and username.
   * If not provided `searchNickname` and `searchUsername` will ignored and considered `false`.
   */
  memberManager?: GuildMemberManager;
}

type CleanUserParseOptions = UserParseOptions;

const userParseOptionsDefinition: OptionsCleanerDefinition<
  UserParseOptions,
  CleanUserParseOptions
> = {
  memberManager: unchecked(),
  searchUsername: unchecked(),
  searchNickname: unchecked(),
  nameParseOptions: unchecked(),
  allowSimilar: unchecked(),
  similarityThreshold: unchecked(),
};

export type UserParseResult = ParseResult<User>;

export function userParser(
  userManager: UserManager,
  options?: UserParseOptions
): Parser<UserParseResult> {
  const cleaned = cleanOptions(userParseOptionsDefinition, options ?? {});
  return async (raw: string): Promise<UserParseResult | undefined> => {
    const snowflakeResult = await snowflakeParser({
      types: [SnowflakeType.Plain, SnowflakeType.User],
    })(raw);
    if (snowflakeResult) {
      try {
        const user = await userManager.fetch(snowflakeResult.value);
        return {
          value: user,
          length: snowflakeResult.length,
        };
        // eslint-disable-next-line no-empty
      } catch {}
    }

    if (!cleaned.memberManager) return undefined;
    const memberResult = await guildMemberParser(cleaned.memberManager, {
      searchId: false,
      searchUsername: cleaned.searchUsername,
      searchNickname: cleaned.searchNickname,
      nameParseOptions: cleaned.nameParseOptions,
      allowSimilar: cleaned.allowSimilar,
      similarityThreshold: cleaned.similarityThreshold,
    })(raw);
    if (!memberResult) return undefined;
    return {
      value: memberResult.value.user,
      length: memberResult.length,
    };
  };
}
