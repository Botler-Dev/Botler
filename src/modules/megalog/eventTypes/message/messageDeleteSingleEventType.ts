import {ColorType, GlobalSettingsWrapper} from '@/settings';
import dayjs from 'dayjs';
import {MessageEmbed} from 'discord.js';
import {MessageMegalogEventCategoryName} from '.';
import {condenseSingleMessageDeletion} from '../../condensers/condenseSingleMessageDeletion';
import {MegalogEventType} from '../../eventType/MegalogEventType';
import {MegalogChannelManager} from '../../MegalogChannelManager';
import {jsonToBuffer} from '../../utils/jsonToBuffer';
import {attachmentSendEventType, getCachedAttachments} from './attachmentSendEventType';
import {addContentField} from './utils/addContentField';
import {partitionAttachments} from './utils/partitionAttachments';
import {toDiscordMegaByteString} from './utils/toDiscordMegaByteString';

const messageDeleteSingleEventTypeName = 'message-delete-single';

export function messageDeleteSingleEventType(
  globalSettings: GlobalSettingsWrapper,
  channelManager: MegalogChannelManager
): MegalogEventType<'messageDelete'> {
  return {
    name: messageDeleteSingleEventTypeName,
    description: `Logs deletions of single messages. Can use \`${attachmentSendEventType.name}\` log messages to recover attachments of deleted messages.`,
    category: MessageMegalogEventCategoryName,
    clientEventName: 'messageDelete',
    processClientEvent: async message => async channel => {
      // Don't log deletions of message-delete-single log messages
      if (
        message.channel.id === channel.id &&
        (!message.author || message.author.id === message.client.user?.id)
      )
        return undefined;

      const embed = new MessageEmbed()
        .setColor(globalSettings.getColor(ColorType.Bad))
        .setTimestamp(Date.now())
        .setFooter(`Message ID: ${message.id} | ${messageDeleteSingleEventTypeName}`);

      addContentField(embed, 'Text Content', message.content);

      if (message.author) embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
      else embed.setAuthor('Unknown', 'https://cdn.discordapp.com/embed/avatars/0.png');

      let innerDescription: string;
      if (message.webhookID) {
        const webhook = await message.fetchWebhook().catch(() => undefined);
        innerDescription = `A message from ${
          webhook ? `the webhook **\`${webhook.name}\`**` : `a webhook`
        } in ${message.channel} was deleted`;
      } else {
        innerDescription = `A message${
          message.author ? ` from ${message.author}` : ''
        } was deleted in ${message.channel}`;
      }
      embed.setDescription(`**${innerDescription}.**`);

      const cachedAttachments =
        message.attachments.size === 0
          ? undefined
          : await getCachedAttachments(channelManager, channel.guild, message.id);
      const condensed = condenseSingleMessageDeletion(
        message,
        cachedAttachments,
        dayjs().valueOf()
      );
      const condensedBuffer = jsonToBuffer(condensed);
      const partitions = cachedAttachments
        ? partitionAttachments(
            cachedAttachments.array(),
            channel.guild.premiumTier,
            condensedBuffer.byteLength
          )
        : undefined;

      if (message.attachments.size > 0) {
        embed.addField(
          `Attachments [${message.attachments.size}]`,
          message.attachments
            .map(attachment => {
              const cached = !attachment.name ? undefined : cachedAttachments?.get(attachment.name);
              const attached = !cached
                ? false
                : !!partitions?.sendable.find(
                    sendableAttachment => (sendableAttachment.name ?? '') === attachment.name
                  );
              return `[${attachment.name}](${
                cached?.url ?? attachment.url
              }) - ${toDiscordMegaByteString(attachment.size)} - ${
                cached ? (attached ? 'attached' : `cached`) : `original`
              }`;
            })
            .join('\n')
        );
      }
      const logMessage = await channel.send({
        embed,
        files: [
          ...(partitions?.sendable ?? []),
          {attachment: condensedBuffer, name: 'single-message-deletion-json'},
        ],
      });
      return async auditEntry => {
        embed.setDescription(`**${innerDescription} probably by ${auditEntry.executor}.**`);
        // The reason is ignored because single message deletions by bots
        // are not logged and thus no reason is ever specified.
        await logMessage.edit(embed);
      };
    },
  };
}
