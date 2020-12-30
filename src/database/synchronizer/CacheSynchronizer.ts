import {Collection, ReadonlyCollection} from 'discord.js';
import {merge, Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {container, DependencyContainer} from 'tsyringe';
import {Entity} from '../wrapper/EntityWrapper';
import DatabaseEventHub from '../DatabaseEventHub';

export type SyncStream<TEntity> = Subject<TEntity | undefined>;

export interface ExhaustStreamPayload<TEntity extends Entity, TCacheKey> {
  key: TCacheKey;
  entity: TEntity | undefined;
}

export default abstract class CacheSynchronizer<
  TEntity extends Entity,
  TCacheKey = unknown,
  TDeleteEventPayload = unknown
> {
  private _syncStreams = new Collection<TCacheKey, SyncStream<TEntity>>();

  protected get syncStreams(): ReadonlyCollection<TCacheKey, SyncStream<TEntity>> {
    return this._syncStreams;
  }

  /**
   * Emits change events for which no syncStream have been found.
   */
  protected exhaustStream = new Subject<ExhaustStreamPayload<TEntity, TCacheKey>>();

  readonly tableName: string;

  protected readonly eventHub: DatabaseEventHub;

  constructor(tableName: string, eventHub = container.resolve(DatabaseEventHub)) {
    this.tableName = tableName;
    this.eventHub = eventHub;
  }

  async initialize(): Promise<void> {
    const entityStream = merge(
      await this.eventHub.listenTo<TEntity>(`sync_${this.tableName}_UPDATE`),
      await this.eventHub.listenTo<TEntity>(`sync_${this.tableName}_INSERT`)
    ).pipe(
      map(entity => ({
        key: this.getCacheKeyFromEntity(entity),
        entity,
      }))
    );
    const deleteStream = (
      await this.eventHub.listenTo<TDeleteEventPayload>(`sync_${this.tableName}_DELETE`)
    ).pipe(map(payload => ({key: this.getCacheKeyFromDelete(payload), entity: undefined})));

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

  protected abstract getCacheKeyFromEntity(entity: TEntity): TCacheKey | undefined;

  protected abstract getCacheKeyFromDelete(payload: TDeleteEventPayload): TCacheKey | undefined;

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