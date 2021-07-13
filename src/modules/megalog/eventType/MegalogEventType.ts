import {ExportProxyClientEvents, GuildAuditLogsEntry, TextChannel} from 'discord.js';
import type {AuditLogSupportedClientEvent, MegalogSupportedClientEvent} from '../clientEvents';

export type MegalogEventTypeName = string;

export type MegalogEventCategoryName = string;

export type MegalogEventTypeAuditLogMatchCallback = (entry: GuildAuditLogsEntry) => Promise<void>;

export abstract class MegalogEventType<
  TClientEventName extends MegalogSupportedClientEvent = MegalogSupportedClientEvent
> {
  abstract readonly name: MegalogEventTypeName;

  abstract readonly description: string;

  abstract readonly category: MegalogEventCategoryName;

  abstract readonly clientEventName: TClientEventName;

  abstract processClientEvent(
    channel: TextChannel,
    ...args: ExportProxyClientEvents[TClientEventName]
  ): Promise<
    | void
    | (TClientEventName extends AuditLogSupportedClientEvent
        ? MegalogEventTypeAuditLogMatchCallback
        : never)
  >;
}
