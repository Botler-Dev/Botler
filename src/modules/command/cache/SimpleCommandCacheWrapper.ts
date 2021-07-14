import {CommandCacheWrapper} from './CommandCacheWrapper';

/**
 * {@link CommandCacheWrapper} which exposes the raw cache for simple use-cases
 * where creating a new class would be too much code.
 */
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
