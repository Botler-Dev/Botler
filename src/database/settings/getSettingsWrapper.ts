import {merge} from 'rxjs';
import {concatMap, filter, map, tap} from 'rxjs/operators';
import {DatabaseEventHub} from '../DatabaseEventHub';
import {SyncStream} from '../synchronizer/CacheSynchronizer';
import {getTableDeleteStream, getTableNonDeleteStream} from '../synchronizer/changeStreams';
import {SettingsEntity, SettingsWrapper} from './SettingsWrapper';

export type SettingsEntityFetcher<TEntity extends SettingsEntity> = () => Promise<
  // Allow null because Prisma returns null for empty results
  TEntity | undefined | null
>;

export type SettingsWrapperCreator<TWrapper extends SettingsWrapper> = (
  syncStream: SyncStream<TWrapper['entity']>,
  entity: TWrapper['entity'] | undefined
) => TWrapper;

/**
 * Listener that gets called on all entity updates to the {@link SettingsWrapper}
 *
 * @param entity The new entity that will be used.
 */
export type SettingsUpdateListener<TEntity extends SettingsEntity> = (
  entity: TEntity | undefined
) => void;

/**
 * Get a synchronized {@link SettingsWrapper} for a given table.
 *
 * @param tableName Name of the PostgreSQL table. (Can be dynamically retrieved via `Prisma.ModelName.YourModelName`)
 */
export async function getSettingsWrapper<TWrapper extends SettingsWrapper>(
  eventHub: DatabaseEventHub,
  tableName: string,
  entityFetcher: SettingsEntityFetcher<TWrapper['entity']>,
  wrapperCreator: SettingsWrapperCreator<TWrapper>,
  updateListener?: SettingsUpdateListener<TWrapper['entity']>
): Promise<TWrapper> {
  let cache: TWrapper | undefined;

  const nonDeleteStream = (
    await getTableNonDeleteStream<TWrapper['entity']>(eventHub, tableName)
  ).pipe(filter(entity => entity.version >= (cache?.version ?? Number.NEGATIVE_INFINITY)));
  const deleteStream = (
    await getTableDeleteStream<Pick<TWrapper['entity'], 'version'>>(eventHub, tableName)
  ).pipe(
    filter(entity => entity.version === cache?.version),
    concatMap(() => entityFetcher()),
    map(entity => entity ?? undefined)
  );
  const syncStream = merge(nonDeleteStream, deleteStream).pipe(
    tap(entity => updateListener?.(entity))
  );

  cache = wrapperCreator(syncStream, await entityFetcher());
  return cache;
}
