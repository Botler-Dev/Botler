import {Collection, ReadonlyCollection} from 'discord.js';
import {merge, Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {container} from 'tsyringe';
import {Entity} from '../wrapper/EntityWrapper';
import DatabaseEventHub from '../DatabaseEventHub';

export type SyncStream<TEntity> = Subject<TEntity | undefined>;

export interface ExhaustStreamPayload<TEntity extends Entity, TCacheKey> {
  key: TCacheKey;
  entity: TEntity | undefined;
}

export type CacheKeyResolver<TMinimalPayload, TCacheKey = unknown> = (
  payload: TMinimalPayload
) => TCacheKey | undefined;

export default class CacheSynchronizer<
  TEntity extends Entity,
  TMinimalPayloadKeys extends keyof TEntity = keyof TEntity,
  TCacheKey = unknown
> {
  private _syncStreams = new Collection<TCacheKey, SyncStream<TEntity>>();

  protected get syncStreams(): ReadonlyCollection<TCacheKey, SyncStream<TEntity>> {
    return this._syncStreams;
  }

  protected readonly cacheKeyResolver: CacheKeyResolver<
    Pick<TEntity, TMinimalPayloadKeys>,
    TCacheKey
  >;

  /**
   * Emits change events for which no syncStream have been found.
   */
  protected exhaustStream = new Subject<ExhaustStreamPayload<TEntity, TCacheKey>>();

  readonly tableName: string;

  protected readonly eventHub: DatabaseEventHub;

  constructor(
    tableName: string,
    cacheKeyResolver: CacheKeyResolver<Pick<TEntity, TMinimalPayloadKeys>, TCacheKey>,
    eventHub = container.resolve(DatabaseEventHub)
  ) {
    this.tableName = tableName;
    this.cacheKeyResolver = cacheKeyResolver;
    this.eventHub = eventHub;
  }

  async initialize(): Promise<void> {
    const entityStream = merge(
      await this.eventHub.listenTo<TEntity>(`sync_${this.tableName}_UPDATE`),
      await this.eventHub.listenTo<TEntity>(`sync_${this.tableName}_INSERT`)
    ).pipe(
      map(entity => ({
        key: this.cacheKeyResolver(entity),
        entity,
      }))
    );
    const deleteStream = (
      await this.eventHub.listenTo<Pick<TEntity, TMinimalPayloadKeys>>(
        `sync_${this.tableName}_DELETE`
      )
    ).pipe(map(payload => ({key: this.cacheKeyResolver(payload), entity: undefined})));

    merge(entityStream, deleteStream).subscribe(({key, entity}) => {
      if (key === undefined) return;
      const stream = this.syncStreams.get(key);
      if (!stream) {
        this.exhaustStream.next({key, entity});
        return;
      }
      stream.next(entity);
    });
  }

  getSyncStream(key: TCacheKey): SyncStream<TEntity> {
    let stream = this.syncStreams.get(key);
    if (stream) return stream;
    stream = new Subject();
    this._syncStreams.set(key, stream);
    return stream;
  }

  removeSyncStream(key: TCacheKey): void {
    this._syncStreams.delete(key);
  }
}
