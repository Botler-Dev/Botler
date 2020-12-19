import {Collection} from 'discord.js';
import {container} from 'tsyringe';
import {Connection, EntityTarget} from 'typeorm';
import {Observable} from 'rxjs';
import CacheEntityWrapper from '../wrapper/CacheEntityWrapper';
import WrapperManager from './WrapperManager';

export type SyncStream<TEntity> = Observable<TEntity | undefined>;

export type CacheKeyResolver<TKey, TArgs extends unknown[]> = (args: TArgs) => TKey;

export default abstract class CacheManager<
  TEntity extends Record<string, any>,
  TWrapper extends CacheEntityWrapper<
    TEntity,
    CacheManager<TEntity, TWrapper, TCacheKey, TCacheKeyArgs>,
    any
  >,
  TCacheKey = unknown,
  TCacheKeyArgs extends unknown[] = unknown[]
> extends WrapperManager<TEntity, TWrapper> {
  cache = new Collection<TCacheKey, TWrapper>();

  private syncStreams = new Collection<TCacheKey, SyncStream<TEntity>>();

  constructor(entityTarget: EntityTarget<TEntity>, connection = container.resolve(Connection)) {
    super(entityTarget, connection);
  }

  abstract getCacheKey(...args: TCacheKeyArgs): TCacheKey;

  protected createSyncStream(cacheKey: TCacheKey): SyncStream<TEntity> {
    const stream: SyncStream<TEntity> = new Observable();
    this.syncStreams.set(cacheKey, stream);
    return stream;
  }
}
