import {Logger} from '@/logger';
import {Client, ExportProxyClientEvents} from 'discord.js';
import {AuditLogMatcher} from '../auditLog/AuditLogMatcher';
import type {MegalogEventTypeManager} from '../eventType/MegalogEventTypeManager';
import type {MegalogChannelManager} from '../MegalogChannelManager';
import {listenToGuildEventWithAuditLog} from './listenToGuildEvent';

export type MegalogSupportedClientEvent = Extract<keyof ExportProxyClientEvents, 'messageDelete'>;

export type AuditLogSupportedClientEvent = Extract<MegalogSupportedClientEvent, 'messageDelete'>;

export function registerClientEventListeners(
  client: Client,
  logger: Logger,
  channelManager: MegalogChannelManager,
  eventTypeManager: MegalogEventTypeManager,
  auditLogMatcher: AuditLogMatcher
): void {
  listenToGuildEventWithAuditLog(
    client,
    logger,
    channelManager,
    eventTypeManager,
    auditLogMatcher,
    'messageDelete',
    async message => message.guild?.fetch(),
    async message => {
      const {author, channel} = message;
      if (!author) return undefined;
      return {
        action: 'MESSAGE_DELETE',
        checker: entry =>
          !!entry.target &&
          'id' in entry.target &&
          entry.target.id === author.id &&
          // @ts-expect-error Discord.js' bad typings don't properly define the extra property
          entry.extra?.channel?.id === channel.id,
      };
    }
  );
}
