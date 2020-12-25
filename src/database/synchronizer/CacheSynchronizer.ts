import {Collection} from 'discord.js';
import {merge, Subject} from 'rxjs';
import {map} from 'rxjs/operators';
import {container} from 'tsyringe';
import DatabaseEventHub from './DatabaseEventHub';

export type SyncStream<TEntity> = Subject<TEntity | undefined>;

export interface ExhaustStreamPayload<TEntity extends Record<string, any>, TCacheKey> {
  key: TCacheKey;
  entity: TEntity | undefined;
}

export default abstract class CacheSynchronizer<
  TEntity extends Record<string, any>,
  TCacheKey = unknown,
  TDeleteEventPayload = unknown
> {
  private syncStreams = new Collection<TCacheKey, SyncStream<TEntity>>();

  private readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Emits change events for which no syncStream have been found.
   */
  protected exhaustStream = new Subject<ExhaustStreamPayload<TEntity, TCacheKey>>();

  async initialize(): Promise<void> {
    const eventHub = container.resolve(DatabaseEventHub);
    const entityStream = merge(
      await eventHub.listenTo<TEntity>(`sync_${this.tableName}_UPDATE`),
      await eventHub.listenTo<TEntity>(`sync_${this.tableName}_INSERT`)
    ).pipe(
      map(entity => ({
        key: this.getCacheKeyFromEntity(entity),
        entity,
      }))
    );
    const deleteStream = (
      await eventHub.listenTo<TDeleteEventPayload>(`sync_${this.tableName}_DELETE`)
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
    this.syncStreams.set(key, stream);
    return stream;
  }

  removeSyncStream(key: TCacheKey): void {
    this.syncStreams.delete(key);
  }
}
