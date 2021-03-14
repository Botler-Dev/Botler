import {BaseManager, Snowflake, TextBasedChannelResolvable} from 'discord.js';

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
