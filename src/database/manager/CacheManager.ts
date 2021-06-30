import {Collection, ReadonlyCollection} from 'discord.js';
import {CachedEntityWrapper} from '../wrapper/CachedEntityWrapper';
import {EntityManager} from './EntityManager';

/**
 * EntityManager that can caches entities.
 *
 * @template TModel Prisma model that can be retrieved with `PrismaClient['camelCaseModelName']`.
 * @template TCacheKey Key used to index cache entires.
 * @template TWrapper EntityWrapper that is held in the cache.
 */
export abstract class CacheManager<
  TModel = unknown,
  TCacheKey = unknown,
  TWrapper extends CachedEntityWrapper<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    CacheManager<TModel, TCacheKey, TWrapper>
  > = CachedEntityWrapper<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CacheManager<TModel, TCacheKey, any>
  >
> extends EntityManager<TModel> {
  private readonly _cache = new Collection<TCacheKey, TWrapper>();

  get cache(): ReadonlyCollection<TCacheKey, TWrapper> {
    return this._cache;
  }

  /**
   * Reactively cache wrapper using specified key.
   * Will automatically remove on `afterUncache` event.
   */
  protected cacheWrapper(key: TCacheKey, wrapper: TWrapper): void {
    this._cache.set(key, wrapper);
    wrapper.afterUncache.subscribe(() => this._cache.delete(key));
  }
}
