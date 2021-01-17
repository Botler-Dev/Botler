import {Collection, ReadonlyCollection} from 'discord.js';
import CacheEntityWrapper from '../wrapper/CacheEntityWrapper';
import WrapperManager from './WrapperManager';
import {Entity} from '../wrapper/EntityWrapper';

export default abstract class CacheManager<
  TEntity extends Entity,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TWrapper extends CacheEntityWrapper<any, This>,
  TCacheKey = unknown,
  This extends CacheManager<TEntity, TWrapper, TCacheKey> = CacheManager<
    TEntity,
    TWrapper,
    TCacheKey,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >
> extends WrapperManager<TEntity> {
  private readonly _cache = new Collection<TCacheKey, TWrapper>();

  get cache(): ReadonlyCollection<TCacheKey, TWrapper> {
    return this._cache;
  }

  protected cacheWrapper(key: TCacheKey, wrapper: TWrapper): void {
    this._cache.set(key, wrapper);
    wrapper.afterCacheStateChange.subscribe(() => this._cache.delete(key));
  }

  uncache(key: TCacheKey): TWrapper | undefined {
    const wrapper = this.cache.get(key);
    wrapper?.uncache();
    return wrapper;
  }
}
