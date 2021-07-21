import {ColorType, GlobalSettingsWrapper} from '@/settings';
import {MessageEmbed} from 'discord.js';
import {MessageMegalogEventCategoryName} from '.';
import {MegalogEventType} from '../../eventType/MegalogEventType';

// Maximum size the rest of the send request package will use in bytes
const MESSAGE_REQUEST_OVERHEAD_SIZE = 32 + 2 ** 10;

const MEBI_BYTE = 2 ** 20;

const MAX_UPLOAD_SIZE = [
  8 * MEBI_BYTE - MESSAGE_REQUEST_OVERHEAD_SIZE,
  8 * MEBI_BYTE - MESSAGE_REQUEST_OVERHEAD_SIZE,
  50 * MEBI_BYTE - MESSAGE_REQUEST_OVERHEAD_SIZE,
  100 * MEBI_BYTE - MESSAGE_REQUEST_OVERHEAD_SIZE,
] as const;

function toMegaByteString(size: number) {
  return `${
    Math.round((size / MEBI_BYTE + Number.EPSILON) * 100) / 100
    // Discord calls actual mebibytes "megabytes" so we do the same here
  }MB`;
}

const attachmentSendEventTypeName = 'attachment-send';

export function attachmentSendEventType(
  globalSettings: GlobalSettingsWrapper
): MegalogEventType<'message'> {
  return {
    name: attachmentSendEventTypeName,
    description:
      'When someone sends a message with attachments those attachments get logged. This can be combined with the `message-delete-*` events to see attachments of deleted messages.',
    category: MessageMegalogEventCategoryName,
    clientEventName: 'message',
    processClientEvent: async message => {
      if (message.attachments.size === 0) return undefined;
      return async channel => {
        if (message.author.id === message.client.user?.id && message.channel.id === channel.id)
          return;
        const sizeLimit = MAX_UPLOAD_SIZE[channel.guild.premiumTier];

        const attachments = message.attachments.array();
        let cumulativeSize = 0;
        const firstUnsendableIndex = attachments.findIndex(attachment => {
          cumulativeSize += attachment.size;
          return cumulativeSize > sizeLimit;
        });
        if (firstUnsendableIndex !== -1) cumulativeSize -= attachments[firstUnsendableIndex].size;

        const sendableAttachments =
          firstUnsendableIndex < 0 ? attachments : attachments.slice(0, firstUnsendableIndex);
        const unsendableAttachments =
          firstUnsendableIndex < 0 ? [] : attachments.slice(firstUnsendableIndex);

        const embed = new MessageEmbed()
          .setDescription(
            `${sendableAttachments.length}/${attachments.length} attachment${
              sendableAttachments.length === 1 ? '' : 's'
            } (${toMegaByteString(cumulativeSize)}) from [a message](${message.url}) sent by ${
              message.author
            } in ${message.channel}.`
          )
          .setColor(globalSettings.getColor(ColorType.Default))
          .setTimestamp(message.createdAt)
          .setFooter(`Message ID: ${message.id} | ${attachmentSendEventTypeName}`);
        if (unsendableAttachments.length > 0)
          embed.addField(
            `Omitted attachments [${unsendableAttachments.length}]`,
            unsendableAttachments
              .map(
                attachment =>
                  `[${attachment.name}](${attachment.url}) - ${toMegaByteString(attachment.size)}`
              )
              .join('\n')
          );
        await channel.send({
          embed,
          files: sendableAttachments,
        });
      };
    },
  };
}
