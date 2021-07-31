import {merge, Observable} from 'rxjs';
import {DatabaseEventHub} from '../DatabaseEventHub';

/**
 * Raw sync stream of all update events from a table.
 *
 * @param {string} tableName Name of the PostgreSQL table. (Can be dynamically get via `Prisma.ModelName.YourModelName`)
 */
export function getTableUpdateStream<TEntity>(
  eventHub: DatabaseEventHub,
  tableName: string
): Promise<Observable<TEntity>> {
  return eventHub.listenTo<TEntity>(`sync_${tableName}_UPDATE`);
}

/**
 * Raw sync stream of all insert events from a table.
 *
 * @param {string} tableName Name of the PostgreSQL table. (Can be dynamically get via `Prisma.ModelName.YourModelName`)
 */
export function getTableInsertStream<TEntity>(
  eventHub: DatabaseEventHub,
  tableName: string
): Promise<Observable<TEntity>> {
  return eventHub.listenTo<TEntity>(`sync_${tableName}_INSERT`);
}

/**
 * Raw sync stream of all events that do not delete a row from a table.
 *
 * @param {string} tableName Name of the PostgreSQL table. (Can be dynamically get via `Prisma.ModelName.YourModelName`)
 */
export async function getTableNonDeleteStream<TEntity>(
  eventHub: DatabaseEventHub,
  tableName: string
): Promise<Observable<TEntity>> {
  return merge(
    await getTableInsertStream<TEntity>(eventHub, tableName),
    await getTableUpdateStream<TEntity>(eventHub, tableName)
  );
}

/**
 * Raw sync stream of all delete events from a table.
 *
 * @param {string} tableName Name of the PostgreSQL table. (Can be dynamically get via `Prisma.ModelName.YourModelName`)
 */
export function getTableDeleteStream<TPartialEntity>(
  eventHub: DatabaseEventHub,
  tableName: string
): Promise<Observable<TPartialEntity>> {
  return eventHub.listenTo<TPartialEntity>(`sync_${tableName}_DELETE`);
}
