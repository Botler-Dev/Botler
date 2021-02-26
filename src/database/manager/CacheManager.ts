import {Collection, ReadonlyCollection} from 'discord.js';
import CacheEntityWrapper from '../wrapper/CachedEntityWrapper';
import WrapperManager from './EntityManager';
import {Entity} from '../wrapper/EntityWrapper';

export default abstract class CacheManager<
  TEntity extends Entity,
  TCacheKey = unknown,
  TWrapper extends CacheEntityWrapper<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    CacheManager<TEntity, TCacheKey, TWrapper>
  > = CacheEntityWrapper<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CacheManager<TEntity, TCacheKey, any>
  >
> extends WrapperManager<TEntity> {
  private readonly _cache = new Collection<TCacheKey, TWrapper>();

  get cache(): ReadonlyCollection<TCacheKey, TWrapper> {
    return this._cache;
  }

  protected cacheWrapper(key: TCacheKey, wrapper: TWrapper): void {
    this._cache.set(key, wrapper);
    wrapper.afterUncache.subscribe(() => this._cache.delete(key));
  }

  uncache(key: TCacheKey): TWrapper | undefined {
    const wrapper = this.cache.get(key);
    wrapper?.uncache();
    return wrapper;
  }
}
