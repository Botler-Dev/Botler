# Megalog Architecture

The Megalog module is split into 4 main parts.

## Event Types

A `MegalogEventType` instance represents a loggable event like a message edit and is responsible for processing and logging all events of said type.
Each instance can specify a single `MegalogSupportedClientEvent` to listen to and provides an entry point for the following processing pipeline:

1. The entry point, a `MegalogClientEventProcessor`, gets called once per [not-ignored](#ignore-manager) client event and determines if the event is relevant to the specific Megalog event type.
    - For global events, it additionally should execute all non-guild-specific processing.
2. If the client event is relevant it returns a `MegalogChannelProcessor`.
3. The channel processor is called for each subscribed channel and should send the log message. For guild events this is once and for global events this can be multiple times.
4. If the specific client event supports audit-log matching the channel processor can return a `MegalogAuditLogEntryProcessor`.
5. The audit-log processor is called once a matching audit-log entry is found and should edit the already send log message with additional information.

All event types need to have a unique name and be registered in the `MegalogEventTypeManager` (which is accessible from outside the module) during initialization so the module can properly wire up all the client events correctly.

## Subscription Manager

The `MegalogSubscriptionManager` manages all Megalog subscriptions and lets consumers assign and unassign channels. It retains a synchronized cache of all channel and guild IDs subscribed to a specific event type and converts them to actual `TextChannel` instances when queried.

!!! attention
    In the database, the actual subscriptions are mapped with the Megalog event type names meaning these should not be changed after deployment. Though in case they need to be changed the database data can also be updated via migrations.

## Ignore Manager

The `MegalogIgnoreManager` manages a list of ignored channels. All client events related to these ignored channels get automatically dropped before reaching the event type processors. The ignore checks are kept fast by a synchronized cache.

## Audit-Log Matcher

The `AuditLogMatcher` is responsible for taking audit-log match requests and try to resolve them. This is done using a provided match filter which is run on new polled audit-log entries and is used to map Discord client events to audit-log entires. Once a match is found a listener is called and the request is removed from the match queue.

The matcher itself does not make any guarantees that a matching audit-log entry will be found and that the listener will ever be called. It will drop requests after some time and has queues with limited sizes for each guild. To improve the efficiency and matching accuracy the matcher's behavior can be adjusted via the [module settings](Configuration.md).

## Client Event Listeners

The client event listeners are not really a component but the accumulated usage of all the above-mentioned parts. They register the listeners in the [Discord client](https://discord.js.org/#/docs/main/stable/class/Client) and communicate with all the necessary components to execute the event processing pipeline. What listeners are implemented and their exact behavior is defined in the [Client Events page](Client-Events.md).
