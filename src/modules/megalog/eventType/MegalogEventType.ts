import {ExportProxyClientEvents, GuildAuditLogsEntry, TextChannel} from 'discord.js';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '../clientEvents';

/**
 * Unique name of a {@link MegalogEventType} in kebab-case.
 */
export type MegalogEventTypeName = string;

/**
 * Name of a category of {@link MegalogEventType}s in kebab-case.
 */
export type MegalogEventCategoryName = string;

export type MegalogEventTypeResolvable = MegalogEventTypeName | MegalogEventType;

/**
 * Gets called on each emitted {@link MegalogSupportedClientEvent} the {@link MegalogEventType} listens to.
 *
 * On guild-specific events it should check if the client event is relevant to its {@link MegalogEventType}.
 * On global events it should additionally also execute non-guild-specific logic to prevent duplicate execution
 * in the returned {@link MegalogChannelProcessor}.
 */
export type MegalogClientEventProcessor<TClientEventName extends MegalogSupportedClientEvent> = (
  ...args: ExportProxyClientEvents[TClientEventName]
) => Promise<undefined | MegalogChannelProcessor<TClientEventName>>;

/**
 * Processor returned by the {@link MegalogClientEventProcessor} which gets called for each subscribed {@link TextChannel}.
 */
export type MegalogChannelProcessor<TClientEventName extends MegalogSupportedClientEvent> = (
  channel: TextChannel
) => Promise<
  TClientEventName extends AuditLogSupportedClientEvent
    ? MegalogAuditLogEntryProcessor | undefined
    : void
>;

/**
 * Processes a {@link GuildAuditLogsEntry} for a specific {@link AuditLogSupportedClientEvent} if a match was found.
 */
export type MegalogAuditLogEntryProcessor = (entry: GuildAuditLogsEntry) => Promise<void>;

/**
 * Megalog event type that listens to a {@link MegalogSupportedClientEvent} and processes it.
 */
export interface MegalogEventType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TClientEventName extends MegalogSupportedClientEvent = any
> {
  /**
   * Unique name of the event type in kebab-case.
   * Used by the the user and in the database so should not change.
   */
  readonly name: MegalogEventTypeName;

  /**
   * Detailed description of what this event type logs.
   */
  readonly description: string;

  /**
   * Name of the event category in kebab-case this event type belongs to.
   */
  readonly category: MegalogEventCategoryName;

  /**
   * Name of the {@link MegalogSupportedClientEvent} this event type listens to.
   */
  readonly clientEventName: TClientEventName;

  /**
   * Entry point of the client event processing chain.
   */
  readonly processClientEvent: MegalogClientEventProcessor<TClientEventName>;
}
