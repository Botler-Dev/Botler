import {Logger} from '@/logger';
import {Client, ClientEvents} from 'discord.js';
import {Subscription} from 'rxjs';
import type {MegalogSupportedClientEvent} from '..';
import {AuditLogMatcher} from '../../auditLog/AuditLogMatcher';
import {MegalogEventTypeManager} from '../../eventType/MegalogEventTypeManager';
import {MegalogIgnoreManager} from '../../MegalogIgnoreManager';
import {MegalogSubscriptionManager} from '../../MegalogSubscriptionManager';
import {
  AuditLogClientEventListenerDefinition,
  ClientEventListenerDefinition,
  createClientEventListener,
  GlobalClientEventListenerDefinition,
  GuildClientEventListenerDefinition,
} from './createClientEventListener';

export type ClientEventListenerDefinitions<
  TGuildEventNames extends keyof ClientEvents,
  TAuditLogEventNames extends keyof ClientEvents,
  TGlobalEventNames extends keyof ClientEvents
> = {
  [TEventName in TGuildEventNames]: GuildClientEventListenerDefinition<TEventName>;
} & {
  [TEventName in TAuditLogEventNames]: AuditLogClientEventListenerDefinition<TEventName>;
} & {
  [TEventName in TGlobalEventNames]: GlobalClientEventListenerDefinition<TEventName>;
};

export type ClientEventSubscriptions = Partial<Record<keyof ClientEvents, Subscription>>;

export function createClientEventListeners<
  TGuildEventNames extends keyof ClientEvents,
  TAuditLogEventNames extends keyof ClientEvents,
  TGlobalEventNames extends keyof ClientEvents
>(
  client: Client,
  logger: Logger,
  subscriptionManager: MegalogSubscriptionManager,
  eventTypeManager: MegalogEventTypeManager,
  ignoreManager: MegalogIgnoreManager,
  auditLogMatcher: AuditLogMatcher,
  definitions: ClientEventListenerDefinitions<
    TGuildEventNames,
    TAuditLogEventNames,
    TGlobalEventNames
  >
): ClientEventSubscriptions {
  return Object.fromEntries(
    (
      Object.entries(definitions) as Array<
        [keyof ClientEvents, ClientEventListenerDefinition<keyof ClientEvents>]
      >
    ).map(([eventName, definition]) => [
      eventName,
      createClientEventListener(
        client,
        logger,
        subscriptionManager,
        eventTypeManager,
        ignoreManager,
        auditLogMatcher,
        // Needs casting here to stop cyclic definition.
        // Calling this function should already make it a MegalogSupportedClientEvent.
        eventName as MegalogSupportedClientEvent,
        definition
      ),
    ])
  );
}
