import {Collection, ReadonlyCollection} from 'discord.js';
import {CachedEntityWrapper} from '../wrapper/CachedEntityWrapper';
import {ModelManager} from './ModelManager';

/**
 * {@link ModelManager} that can caches entities.
 *
 * @template TModel Prisma model that can be retrieved with `PrismaClient['camelCaseModelName']`.
 * @template TCacheKey Key used to index cache entires.
 * @template TWrapper EntityWrapper that is held in the cache.
 */
export abstract class CacheManager<
  TModel = unknown,
  TCacheKey = unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TWrapper extends CachedEntityWrapper<any> = CachedEntityWrapper<any>
> extends ModelManager<TModel> {
  private readonly _cache = new Collection<TCacheKey, TWrapper>();

  get cache(): ReadonlyCollection<TCacheKey, TWrapper> {
    return this._cache;
  }

  /**
   * Reactively cache wrapper using specified key.
   * Will automatically remove on {@link CachedEntityWrapper.afterDecache} event.
   */
  protected cacheWrapper(key: TCacheKey, wrapper: TWrapper): void {
    this._cache.set(key, wrapper);
    wrapper.afterDecache.subscribe(() => this._cache.delete(key));
  }
}
