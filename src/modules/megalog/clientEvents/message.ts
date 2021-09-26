import {Guild, Message, PartialMessage, Snowflake} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {ClientEventListenerType} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedMessageGuildClientEvent = 'message' | 'messageUpdate';

export type SupportedMessageAuditLogClientEvent = 'messageDelete' | 'messageDeleteBulk';

export type SupportedMessageGlobalClientEvent = never;

const messageToGuild = (message: Message | PartialMessage): Guild | undefined =>
  message.guild ?? undefined;

const messageToInvolvedChannel = (message: Message | PartialMessage): Snowflake[] => [
  message.channel.id,
];

export const messageClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedMessageGuildClientEvent,
  SupportedMessageAuditLogClientEvent,
  SupportedMessageGlobalClientEvent
> = {
  message: {
    type: ClientEventListenerType.Guild,
    channelResolver: messageToInvolvedChannel,
    guildResolver: messageToGuild,
  },
  messageUpdate: {
    type: ClientEventListenerType.Guild,
    guildResolver: messageToGuild,
    channelResolver: messageToInvolvedChannel,
  },
  messageDelete: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: messageToGuild,
    channelResolver: messageToInvolvedChannel,
    filterResolver: message => {
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
    },
  },
  messageDeleteBulk: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: messages => messages.first()?.guild ?? undefined,
    channelResolver: messages => {
      const channelId = messages.first()?.channel.id;
      if (channelId === undefined) return [];
      return [channelId];
    },
    filterResolver: messages => {
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
    },
  },
};
