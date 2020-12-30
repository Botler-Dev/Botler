# Entity System

Botler uses a custom entity system that wraps the existing TypeORM entities and repositories. This was done for the following reasons:

- Have transient data in entities like objects from Discord.js
- Have control over how entities are initialized (TypeORM does it strangely)
- Be able to have a synchronized cache
- Be able to return a result with default values when there is no actual database entry

## Architecture

The system is divided into a cached and uncached part. The cached one being mostly an extension of the uncached system. To understand how it works you can read the part below and also look at the code in `src/database`. Though do not take the GlobalSettings implementation as an example as it is handles a special case of only having one wrapper in the entire cache that can change what entity it represents in the database.

### Uncached

In the center there is a `WrapperManager` that holds the TypeORM repository and is a gateway for requesting data. It wraps the raw entities with a `NormalEntityWrapper` that can only be modified by the functions it provides after initialization. All modifications are synchronous and the wrapper only saves the updated entity once `.save()` is called.

### Cached

The cached part uses a `CacheManager` which extends from `WrapperManager`. This manager holds cache management logic and the actual wrapper cache. It also holds a `CacheSynchronizer` which uses the `DatabaseEventHub` to listen to change notifications from the database. After the `CacheSynchronizer` receives an event it extrapolates the cache key to only send the change to a specific `CacheEntityWrapper` from the cache. This special entity is used in place of `NormalEntityWrapper` and takes in a `SyncStream` on initialization to listen for database changes. Additionally, the `CacheEntityWrapper` also has logic to track whether it is still cached or not. When it gets uncached it also no longer receives any database changes and thus should be considered unsynchronized.

#### Cache Synchronization Edge Cases

In case there are unsaved changes and it receives changes from the database the unsaved changes get overwritten. This edge case will never occur as long as the changes always get saved before completing a Promise as JavaScript is single-threaded. Though this would in the worst case overwrite unsynchronized changes, that is a problem for the future when we have multiple instances running concurrently.

#### Database Change Notifications

By default, PostgreSQL does not emit any notifications when data is manipulated. The entity system uses triggers created when running migrations to get notified of changes on specific tables.

This solution is not perfect and has two key points that need to be kept in mind:

- The `TRUNCATE` triggers don't work as specified in the [Documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html) and are not implemented. Meaning the `TRUNCATE` statement should never be used on tables with synchronized caches as the entity system wouldn't get notified.
- There is no way to only run the triggers on the result of a transaction. By default, they are put into a queue and executed after the transaction completes (Also called "deferred". See the [`CREATE TABLE` Documentation](https://www.postgresql.org/docs/current/sql-createtable.html)). This behavior must not be altered as it might lead to invalid change notifications. Specifically, when the transaction sends a change notification and then fails.
