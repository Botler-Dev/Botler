import {GuildMember} from 'discord.js';
import {compareTwoStrings} from 'string-similarity';
import GuildMemberManager from '../../../database/managers/GuildMemberManager';
import GuildMemberWrapper from '../../../database/wrappers/GuildMemberWrapper';
import {optional} from '../../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {
  generateDefaultOrNothing,
  ParseOptions,
  parseOptionsDefinition,
  Parser,
  ParseResult,
} from './parser';
import snowflakeParser, {SnowflakeType} from './snowflakeParser';
import stringParser, {StringParseOptions} from './stringParser';

export interface GuildMemberParserOptions extends ParseOptions<GuildMemberWrapper> {
  /**
   * If same user id should be searched for. (default `true`)
   */
  searchId?: boolean;
  /**
   * If same/similar username should be searched for. (default `true`)
   */
  searchUsername?: boolean;
  /**
   * If same/similar nickname should be searched for. (default `true`)
   */
  searchNickname?: boolean;
  /**
   * StringParseOptions for parsing name. (default `{}`)
   */
  nameParseOptions?: StringParseOptions;
  /**
   * If similar username / nicknames should be searched for. (default `true`)
   */
  allowSimilar?: boolean;
  /**
   * Threshold for when a similarity search result can be considered valid. (default `0.2`)
   */
  similarityThreshold?: number;
}

interface CleanGuildMemberParserOptions extends GuildMemberParserOptions {
  searchId: boolean;
  searchUsername: boolean;
  searchNickname: boolean;
  nameParseOptions: StringParseOptions;
  allowSimilar: boolean;
  similarityThreshold: number;
}

const guildMemberParseOptionsDefinition: OptionsCleanerDefinition<
  GuildMemberParserOptions,
  CleanGuildMemberParserOptions
> = {
  ...parseOptionsDefinition,
  searchId: optional(true),
  searchUsername: optional(true),
  searchNickname: optional(true),
  nameParseOptions: optional({}),
  allowSimilar: optional(true),
  similarityThreshold: optional(0.3),
};

export type GuildMemberParseResult = ParseResult<GuildMemberWrapper>;

const DISCORD_NAME_MAX_LENGTH = 32;

/**
 * Tries to parse a string to a GuildMemberWrapper.
 *
 * Searches in following order (some may be omitted through the options):
 *  1. User id
 *  2. Same username
 *  3. Same nickname
 *  4. Most similar user- or nickname (case-insensitive)
 */
export function guildMemberParser(
  guildMemberManager: GuildMemberManager,
  options?: GuildMemberParserOptions
): Parser<GuildMemberWrapper> {
  const cleaned = cleanOptions(guildMemberParseOptionsDefinition, options ?? {});
  return async (raw: string): Promise<GuildMemberParseResult | undefined> => {
    if (cleaned.searchId) {
      const snowflakeResult = await snowflakeParser({
        types: [SnowflakeType.Plain, SnowflakeType.User],
      })(raw);
      if (snowflakeResult)
        try {
          const member = await guildMemberManager.fetch(snowflakeResult.value);
          return {value: member, length: snowflakeResult.length};
          // eslint-disable-next-line no-empty
        } catch {}
    }

    if (!cleaned.searchUsername && !cleaned.searchNickname)
      return generateDefaultOrNothing(cleaned);

    const nameResult = await stringParser(cleaned.nameParseOptions)(raw);
    if (!nameResult) return generateDefaultOrNothing(cleaned);
    const generateNameSearchResult = async (member: GuildMember) => ({
      value: await guildMemberManager.fetch(member),
      length: nameResult.length,
    });

    if (cleaned.searchUsername && nameResult.value.length <= DISCORD_NAME_MAX_LENGTH) {
      const member = (
        await guildMemberManager.guild.discord.members.fetch({
          query: nameResult.value,
          limit: 1,
        })
      ).first();
      if (member?.user.username === nameResult.value) return generateNameSearchResult(member);
    }

    const members = await guildMemberManager.guild.discord.members.fetch();

    if (cleaned.searchNickname && nameResult.value.length <= DISCORD_NAME_MAX_LENGTH) {
      const member = members.find(potentialMember => potentialMember.nickname === nameResult.value);
      if (member) return generateNameSearchResult(member);
    }

    if (!cleaned.allowSimilar) return generateDefaultOrNothing(cleaned);

    const queryName = nameResult.value.slice(0, DISCORD_NAME_MAX_LENGTH).toLowerCase();
    let highestSimilarity = 0;
    let member = members.first();
    members.forEach(potentialMember => {
      const similarities: number[] = [];
      if (cleaned.searchUsername)
        similarities.push(
          compareTwoStrings(queryName, potentialMember.user.username.toLowerCase())
        );
      if (cleaned.searchNickname && potentialMember.nickname)
        similarities.push(compareTwoStrings(queryName, potentialMember.nickname.toLowerCase()));

      const similarity = Math.max(...similarities);
      if (highestSimilarity >= similarity) return;
      highestSimilarity = similarity;
      member = potentialMember;
    });

    if (!member || highestSimilarity < cleaned.similarityThreshold)
      return generateDefaultOrNothing(cleaned);
    return generateNameSearchResult(member);
  };
}
