import {
  CategoryChannel,
  Collection,
  GuildChannel,
  NewsChannel,
  Snowflake,
  StoreChannel,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import {compareTwoStrings} from 'string-similarity';
import {optional, unchecked} from '../../../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';
import {Parser, ParseResult} from '../parser/parser';
import snowflakeParser, {SnowflakeType} from './snowflakeParser';
import stringParser, {StringParseOptions} from './stringParser';

export type GuildChannelType =
  | typeof CategoryChannel
  | typeof NewsChannel
  | typeof TextChannel
  | typeof VoiceChannel
  | typeof StoreChannel;

export interface ChannelParseOptions {
  /**
   * If same channel id should be searched for. (default `true`)
   */
  searchId?: boolean;
  /**
   * If same/similar channel id should be searched for. (default `true`)
   */
  searchName?: boolean;
  /**
   * StringParseOptions for parsing name. (default `{}`)
   */
  nameParseOptions?: StringParseOptions;
  /**
   * If similar names should be searched for. (default `true`)
   */
  allowSimilar?: boolean;
  /**
   * Channel types which should be included in similarity search. (default all channel types)
   */
  similarNameTypeFilter?: GuildChannelType[];
  /**
   * Threshold for when a similarity search result can be considered valid. (default `0.2`)
   */
  similarityThreshold?: number;
}

interface CleanChannelParseOptions extends ChannelParseOptions {
  searchId: boolean;
  searchName: boolean;
  nameParseOptions: StringParseOptions;
  allowSimilar: boolean;
  similarityThreshold: number;
}

const channelParseOptionsDefinition: OptionsCleanerDefinition<
  ChannelParseOptions,
  CleanChannelParseOptions
> = {
  searchId: optional(true),
  searchName: optional(true),
  nameParseOptions: optional({}),
  allowSimilar: optional(true),
  similarNameTypeFilter: unchecked(),
  similarityThreshold: optional(0.2),
};

export type ChannelParseResult<
  TChannel extends GuildChannel = GuildChannel
> = ParseResult<TChannel>;

const DISCORD_CHANNEL_NAME_MAX_LENGTH = 100;

async function snowflakeParse<TChannel extends GuildChannel>(
  channels: Collection<Snowflake, TChannel>,
  raw: string
): Promise<ChannelParseResult<TChannel> | undefined> {
  const snowflakeResult = await snowflakeParser({
    types: [SnowflakeType.Plain, SnowflakeType.Channel],
  })(raw);
  if (!snowflakeResult) return undefined;
  const channel = channels.get(snowflakeResult.value);
  if (!channel) return undefined;
  return {value: channel, length: snowflakeResult.length};
}

export default function channelParser<TChannel extends GuildChannel>(
  channels: Collection<Snowflake, TChannel>,
  options?: ChannelParseOptions
): Parser<ChannelParseResult<TChannel>> {
  const cleaned = cleanOptions(channelParseOptionsDefinition, options ?? {});
  return async (raw: string): Promise<ChannelParseResult<TChannel> | undefined> => {
    if (cleaned.searchId) {
      const result = await snowflakeParse(channels, raw);
      if (result) return result;
    }

    if (!cleaned.searchName) return undefined;
    const nameResult = await stringParser(cleaned.nameParseOptions)(raw);
    if (!nameResult) return undefined;
    const generateResult = (channel: TChannel) => ({
      value: channel,
      length: nameResult.length,
    });

    const exactMatchChannel = channels.find(channel => channel.name === nameResult.value);
    if (exactMatchChannel) return generateResult(exactMatchChannel);

    if (!cleaned.allowSimilar) return undefined;
    const queryName = nameResult.value
      .slice(0, DISCORD_CHANNEL_NAME_MAX_LENGTH)
      .toLocaleLowerCase();
    let highestSimilarity = 0;
    let bestMatchChannel = channels.first();
    channels.forEach(potentialChannel => {
      if (
        cleaned.similarNameTypeFilter &&
        !cleaned.similarNameTypeFilter.some(type => potentialChannel instanceof type)
      )
        return;
      const similarity = compareTwoStrings(queryName, potentialChannel.name);
      if (highestSimilarity >= similarity) return;
      highestSimilarity = similarity;
      bestMatchChannel = potentialChannel;
    });

    if (!bestMatchChannel || highestSimilarity < cleaned.similarityThreshold) return undefined;
    return generateResult(bestMatchChannel);
  };
}
