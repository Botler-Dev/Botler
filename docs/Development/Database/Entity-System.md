# Entity System

Botler uses a custom entity system that wraps the raw database entities and prisma models. This was done to be able to do the following things:

- Have transient data in entities like objects from Discord.js
- Have control over how entities are initialized
- Have a synchronized cache
- Return a result with default values when there is no actual database entry

## Architecture

The system is divided into a uncached, cached, and synchronized part. Each being an extension of the former (synchronized extends cached extends uncached). To understand how it works you can read the part below and also look at the code in `src/database`. Though do not take the GlobalSettings implementation as an example as it handles a special case of only having one wrapper in the entire cache that can change what entity it represents in the database.

### Uncached

In the center, there is an `EntityManager` that holds a Prisma model and is a gateway for requesting data. There, raw entities can be wrapped with an `EntityWrapper`. The wrapper can either make the entity only mutable through its functions or directly expose it. All modifications are synchronous and are only saved once `.save()` is called on the wrapper.

### Cached

The cached part uses a `CacheManager` which extends from `WrapperManager`. This manager additionally holds cache management logic and the actual cache of `CachedEntityWrapper`s. Extending from `EntityManager`, they keep track of their caching status.

### Synchronized

To also have the cache synced to the database, the `CacheManager` also needs to hold a `CacheSynchronizer`. It uses the `DatabaseEventHub` to listen to change notifications from the database. After the `CacheSynchronizer` receives an event it extrapolates the cache key to only send the change to a specific `SynchronizedEntityWrapper`. These extend the `CachedEntityWrapper` and hold the entity in a reactive wrapper (A `BehaviorSubject` from `rxjs`). They take in a `SyncStream` on initialization to listen for database changes until they get uncached.

#### Cache Synchronization Edge Cases

In case there are unsaved changes and the bot receives changes from the database the unsaved changes will be overwritten. This edge case will never occur as long as the changes always get saved before completing a Promise as JavaScript is single-threaded. This would, in the worst case, overwrite unsynchronized changes on the database, but that is a problem for the future when we have multiple instances running concurrently.

#### Database Change Notifications

By default, PostgreSQL does not emit any notifications when data is manipulated. The entity system uses triggers created when running migrations to get notified of changes on specific tables.

This solution is not perfect and has two key points that need to be kept in mind:

- The `TRUNCATE` triggers don't work as specified in the [Documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html) and are not implemented. Meaning the `TRUNCATE` statement should never be used on tables with synchronized caches as the entity system wouldn't get notified.
- There is no way to only run the triggers on the result of a transaction. By default, they are put into a queue and executed after the transaction completes (Also called "deferred". See the [`CREATE TABLE` Documentation](https://www.postgresql.org/docs/current/sql-createtable.html)). This behavior must not be altered as it might lead to invalid change notifications. Specifically, when the transaction sends a change notification and then rolls back.
