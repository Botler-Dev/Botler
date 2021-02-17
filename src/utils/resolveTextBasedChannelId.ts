import {Snowflake, TextBasedChannelResolvable} from 'discord.js';

export default function resolveTextBasedChannelId(
  resolvable: TextBasedChannelResolvable
): Snowflake {
  if (typeof resolvable === 'string') return resolvable;
  return resolvable.id;
}
