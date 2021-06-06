import {CommandCacheWrapper} from './CommandCacheWrapper';

export class SimpleCommandCacheWrapper<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TCache extends Record<string, any> = Record<string, unknown>
> extends CommandCacheWrapper<TCache> {
  get cache(): TCache {
    return this.entity.cache;
  }

  set cache(value: TCache) {
    this.setCache(value);
  }
}
