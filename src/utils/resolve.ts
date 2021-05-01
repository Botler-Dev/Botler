import {
  AnyEmojiResolvable,
  BaseManager,
  GuildEmoji,
  GuildEmojiManager,
  Snowflake,
  TextBasedChannelResolvable,
} from 'discord.js';

export function resolveTextBasedChannelId(resolvable: TextBasedChannelResolvable): Snowflake {
  if (typeof resolvable === 'string') return resolvable;
  return resolvable.id;
}

export function resolveIdChecked<
  TManager extends BaseManager<Snowflake, unknown, TResolvable>,
  TResolvable
>(manger: TManager, resolvable: TResolvable): Snowflake {
  const result = manger.resolveID(resolvable);
  if (!result) throw new Error(`Could not resolve resolvable to an id.`);
  return result;
}

export function resolveAnyEmoji(
  manager: GuildEmojiManager,
  resolvable: AnyEmojiResolvable
): GuildEmoji | string | undefined {
  if (typeof resolvable === 'string' && resolvable.length === 1) return resolvable;
  return manager.resolve(resolvable) ?? undefined;
}
