import {ExportProxyClientEvents, GuildAuditLogsEntry, TextChannel} from 'discord.js';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '../clientEvents';

export type MegalogEventTypeName = string;

export type MegalogEventCategoryName = string;

export type MegalogEventTypeResolvable = MegalogEventTypeName | MegalogEventType;

export type MegalogChannelProcessor<TClientEventName extends MegalogSupportedClientEvent> = (
  channel: TextChannel
) => Promise<
  TClientEventName extends AuditLogSupportedClientEvent
    ? MegalogAuditLogEntryProcessor | undefined
    : void
>;

export type MegalogAuditLogEntryProcessor = (entry: GuildAuditLogsEntry) => Promise<void>;

export interface MegalogEventType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TClientEventName extends MegalogSupportedClientEvent = any
> {
  readonly name: MegalogEventTypeName;

  readonly description: string;

  readonly category: MegalogEventCategoryName;

  readonly clientEventName: TClientEventName;

  readonly processClientEvent: (
    ...args: ExportProxyClientEvents[TClientEventName]
  ) => Promise<undefined | MegalogChannelProcessor<TClientEventName>>;
}
