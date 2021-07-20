import {ColorType, GlobalSettingsWrapper} from '@/settings';
import {MessageEmbed} from 'discord.js';
import {MessageMegalogEventCategoryName} from '.';
import {MegalogEventType} from '../../eventType/MegalogEventType';

const MESSAGE_REQUEST_OVERHEAD_SIZE = 32 + 2 ** 10;

const MEBI_BYTE = 2 ** 20;

const MAX_UPLOAD_SIZE = [
  8 * MEBI_BYTE - MESSAGE_REQUEST_OVERHEAD_SIZE,
  8 * MEBI_BYTE - MESSAGE_REQUEST_OVERHEAD_SIZE,
  50 * MEBI_BYTE - MESSAGE_REQUEST_OVERHEAD_SIZE,
  100 * MEBI_BYTE - MESSAGE_REQUEST_OVERHEAD_SIZE,
] as const;

export function attachmentSendEventType(
  globalSettings: GlobalSettingsWrapper
): MegalogEventType<'message'> {
  return {
    name: 'attachment-send',
    description:
      'When someone sends a message with attachments those attachments get logged. This can be combined with the `message-delete-` events to see attachments of deleted messages.',
    category: MessageMegalogEventCategoryName,
    clientEventName: 'message',
    processClientEvent: async message => {
      if (message.attachments.size === 0) return undefined;
      return async channel => {
        if (message.author.id === message.client.user?.id && message.channel.id === channel.id)
          return;
        const sizeLimit = MAX_UPLOAD_SIZE[channel.guild.premiumTier];
        const sendableAttachments = message.attachments.filter(
          attachment => attachment.size <= sizeLimit
        );
        const unsendableAttachments = message.attachments.filter(
          attachment => attachment.size > sizeLimit
        );

        const embed = new MessageEmbed()
          .setDescription(
            `${sendableAttachments.size}/${message.attachments.size} attachment${
              sendableAttachments.size === 1 ? '' : 's'
            } from [a message](${message.url}) sent by ${message.author} in ${message.channel}.`
          )
          .setColor(globalSettings.getColor(ColorType.Default))
          .setTimestamp(message.createdAt)
          .setFooter(`Message ID: ${message.id}`);
        if (unsendableAttachments.size > 0)
          embed.addField(
            `Omitted oversized attachments [${unsendableAttachments.size}]`,
            unsendableAttachments
              .map(
                attachment =>
                  `[${attachment.name}](${attachment.url}) - ${(attachment.size / MEBI_BYTE)
                    // Discord calls actual mebibytes "megabytes" so we do the same here
                    .toPrecision(2)}MB`
              )
              .join('\n')
          );
        await channel.send({
          embed,
          files: sendableAttachments.array(),
        });
      };
    },
  };
}
