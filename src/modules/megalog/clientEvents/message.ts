import {ExportProxyClientEvents} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedMessageClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'message' | 'messageDelete' | 'messageDeleteBulk' | 'messageUpdate'
>;

export type AuditLogSupportedMessageClientEvent = Extract<
  MegalogSupportedMessageClientEvent,
  'messageDelete' | 'messageDeleteBulk'
>;

export function registerMessageClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEvent('message', async message => message.guild ?? undefined);

  utils.listenToGuildEventWithAuditLog(
    'messageDelete',
    async message => message.guild ?? undefined,
    async message => {
      const {author, channel} = message;
      if (!author) return undefined;
      const channelId = channel.id;
      const authorId = author.id;
      return {
        action: 'MESSAGE_DELETE',
        checker: entry =>
          checkAuditLogEntryTargetId(entry, authorId) &&
          // Discord.js' bad typings don't properly define the extra property.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entry.extra as any)?.channel?.id === channelId,
      };
    }
  );

  utils.listenToGuildEventWithAuditLog(
    'messageDeleteBulk',
    async messages => messages.first()?.guild ?? undefined,
    async messages => {
      const firstMessage = messages.first();
      if (!firstMessage) return undefined;
      const channelId = firstMessage.channel.id;
      const deleteCount = messages.size;
      return {
        action: 'MESSAGE_BULK_DELETE',
        checker: entry =>
          checkAuditLogEntryTargetId(entry, channelId) &&
          // Discord.js' bad typings don't properly define the extra property.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entry.extra as any)?.count >= deleteCount,
      };
    }
  );

  utils.listenToGuildEvent('messageUpdate', async oldMessage => oldMessage.guild ?? undefined);
}
