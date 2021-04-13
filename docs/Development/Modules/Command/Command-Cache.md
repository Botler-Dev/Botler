# Command Cache

To allow command executions to span longer than the initial execution started by for example a `?!ping` message, the Command module provides a command cache. This "cache" holds data to be used between executions and persists even downtimes by being stored in the database. To create a cache for a command, the `CommandCacheWrapper` needs to be extended or the `SimpleCommandCacheWrapper` can be used, which can hold a JSON object-like as cache.

The benefit of creating a custom cache by extending `CommandCacheWrapper` is that it allows a cleaner interface by moving cache manipulating logic into the class itself and by holding transient data between executions. Objects that may be too big to be stored or that cannot be represented by the JSON format can be still cached. Simply only save a reference like an ID in the cache and hold the real object in the wrapper. For example a guild id in the raw cache but a `Guild` instance in the wrapper.

## Lifecycle

Command caches can only be created using the `InitialExecutionContext` by calling the `createCache` with an expiration date and the raw initial cache. This call will be propagated to the `CommandCacheManager` which then creates the database entity and passes it to the commands `wrapCacheEntity` method. The resulting `CommandCacheWrapper` will then be returned as a result of the `createCache` method call and set as the context's cache. The context's cache is stored in the `cache` property in all `ExecutionContext` classes. In case the cache needs to be retrieved from the database the `wrapCacheEntity` of the command will also be used. Meaning `wrapCacheEntity` is expected to handle all saved states.

Once a command cache expires, it can no longer be retrieved from the `CommandCacheManager` but is guaranteed to exist at least 5 minutes (defined in `CommandCacheWrapper.DELETE_DELAY`) after its expiration. This is done to prevent cache deletion while it is still being processed by a command. You can also manually delete the cache by calling the wrapper's `delete` method.

## Listeners

The triggers for command executions with command caches are called listeners. Currently, there are two types: reaction and response listeners. All listeners can be created and deleted using methods provided by the `CommandCacheWrapper`.

!!! note
    Creating listeners with a certain scope will delete listeners with a smaller or same one. By scope, the specificity of the listener is meant. For example, would a response listener that listens to messages in a specific channel delete all listeners that listen to the same channel even those that limit it to a certain user to prevent double listening. Look at `addListener` and `removeListener` methods in the `ReactionListenerManager` or `ResponseListenerManager` to understand this behavior better.

Listeners are automatically deleted with their referenced command cache.
