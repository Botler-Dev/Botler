import {Collection, ReadonlyCollection} from 'discord.js';
import {container} from 'tsyringe';
import {Connection, EntityTarget} from 'typeorm';
import CacheEntityWrapper from '../wrapper/CacheEntityWrapper';
import WrapperManager from './WrapperManager';
import type CacheSynchronizer from '../synchronizer/CacheSynchronizer';
import type {SyncStream} from '../synchronizer/CacheSynchronizer';

export type WrapperGenerator<
  TEntity extends Record<string, any>,
  TWrapper extends CacheEntityWrapper<TEntity, any, any>
> = (syncStream: SyncStream<TEntity>) => TWrapper;

export default abstract class CacheManager<
  TEntity extends Record<string, any>,
  TWrapper extends CacheEntityWrapper<TEntity, This, any>,
  TCacheKey = unknown,
  TSynchronizer extends CacheSynchronizer<TEntity, TCacheKey, unknown> = CacheSynchronizer<
    TEntity,
    TCacheKey,
    unknown
  >,
  This extends CacheManager<TEntity, TWrapper, TCacheKey, TSynchronizer> = CacheManager<
    TEntity,
    TWrapper,
    TCacheKey,
    TSynchronizer,
    any
  >
> extends WrapperManager<TEntity, TWrapper> {
  private readonly _cache = new Collection<TCacheKey, TWrapper>();

  get cache(): ReadonlyCollection<TCacheKey, TWrapper> {
    return this._cache;
  }

  protected synchronizer: TSynchronizer;

  constructor(
    entityTarget: EntityTarget<TEntity>,
    synchronizerGenerator: (tableName: string) => TSynchronizer,
    connection = container.resolve(Connection)
  ) {
    super(entityTarget, connection);
    this.synchronizer = synchronizerGenerator(this.repo.metadata.tableName);
  }

  async initialize(): Promise<void> {
    this.synchronizer.initialize();
  }

  protected registerWrapper(
    key: TCacheKey,
    wrapperGenerator: WrapperGenerator<TEntity, TWrapper>
  ): TWrapper {
    const wrapper = wrapperGenerator(this.synchronizer.getSyncStream(key));
    this._cache.set(key, wrapper);
    wrapper.afterCacheStateChange.subscribe(() => {
      this.synchronizer.removeSyncStream(key);
      this._cache.delete(key);
    });
    return wrapper;
  }

  uncache(key: TCacheKey): TWrapper | undefined {
    const wrapper = this.cache.get(key);
    wrapper?.uncache();
    return wrapper;
  }
}
