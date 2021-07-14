import {Collection, ReadonlyCollection} from 'discord.js';
import {merge, Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {Entity} from '../wrapper/EntityWrapper';
import {DatabaseEventHub} from '../DatabaseEventHub';

/**
 * Stream of the entity's state in the database.
 */
export type SyncStream<TEntity> = Subject<TEntity | undefined>;

export interface ExhaustStreamPayload<TEntity extends Entity, TCacheKey> {
  key: TCacheKey;
  entity: TEntity | undefined;
}

export type CacheKeyResolver<TMinimalPayload, TCacheKey = unknown> = (
  payload: TMinimalPayload
) => TCacheKey | undefined;

/**
 * Uses the {@link DatabaseEventHub} to create {@link SyncStream}s for {@link SynchronizedEntityWrapper} to consume.
 * On the PostgreSQL side the [sync triggers](https://botler.readthedocs.io/en/master/Development/Database/Sync-Triggers/) have to be manually created via migrations.
 *
 * @template TEntity Entity will be synchronized.
 * @template TMinimalPayloadKeys What properties of the entity will be the database send on the delete event.
 * @template TCacheKey Key used to index SyncStreams.
 */
export class CacheSynchronizer<
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
   * Emits change events for which no SyncStream has been found.
   */
  protected exhaustStream = new Subject<ExhaustStreamPayload<TEntity, TCacheKey>>();

  readonly tableName: string;

  protected readonly eventHub: DatabaseEventHub;

  /**
   * Creates a {@link CacheSynchronizer} that then has to be initialized using {@link CacheSynchronizer.initialize}().
   *
   * @param {string} tableName Name of the PostgreSQL table. (Can be dynamically get via `Prisma.ModelName.YourModelName`)
   * @param {CacheKeyResolver<Pick<TEntity, TMinimalPayloadKeys>, TCacheKey>} cacheKeyResolver Convert received entities into {@link TCacheKey}
   * @memberof CacheSynchronizer
   */
  constructor(
    eventHub: DatabaseEventHub,
    tableName: string,
    cacheKeyResolver: CacheKeyResolver<Pick<TEntity, TMinimalPayloadKeys>, TCacheKey>
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
