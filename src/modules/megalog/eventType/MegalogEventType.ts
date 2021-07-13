import {ExportProxyClientEvents, GuildAuditLogsEntry, TextChannel} from 'discord.js';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '../clientEvents';

export type MegalogEventTypeName = string;

export type MegalogEventCategoryName = string;

export type MegalogAuditLogEntryProcessor = (entry: GuildAuditLogsEntry) => Promise<void>;

export type MegalogEventTypeResolvable = MegalogEventTypeName | MegalogEventType;

export interface MegalogEventType<
  TClientEventName extends MegalogSupportedClientEvent = MegalogSupportedClientEvent
> {
  readonly name: MegalogEventTypeName;

  readonly description: string;

  readonly category: MegalogEventCategoryName;

  readonly clientEventName: TClientEventName;

  readonly processClientEvent: (
    channel: TextChannel,
    ...args: ExportProxyClientEvents[TClientEventName]
  ) => Promise<
    | void
    | (TClientEventName extends AuditLogSupportedClientEvent
        ? MegalogAuditLogEntryProcessor
        : never)
  >;
}
