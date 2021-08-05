import {ColorType, GlobalSettingsWrapper} from '@/settings';
import dayjs from 'dayjs';
import {Message, MessageEmbed, PartialMessage} from 'discord.js';
import {messageMegalogEventCategoryName} from '.';
import {condenseSingleMessageDeletion} from '../../condensers/condenseSingleMessageDeletion';
import {MegalogEventType} from '../../eventType/MegalogEventType';
import {MegalogGuildSettingsManager} from '../../guildSettings/MegalogGuildSettingsManager';
import {MegalogChannelManager} from '../../MegalogChannelManager';
import {jsonToBuffer} from '../../utils/jsonToBuffer';
import {attachmentSendEventType, getCachedAttachments} from './attachmentSendEventType';
import {addContentField} from './utils/addContentField';
import {partitionAttachments} from './utils/partitionAttachments';
import {toDiscordMegaByteString} from './utils/toDiscordMegaByteString';

const messageDeleteSingleEventTypeName = 'message-delete-single';

async function generateInnerDescription(message: Message | PartialMessage) {
  if (message.webhookID) {
    const webhook = await message.fetchWebhook().catch(() => undefined);
    return `A message from ${webhook ? `the webhook **\`${webhook.name}\`**` : `a webhook`} in ${
      message.channel
    } was deleted`;
  }
  return `A message${message.author ? ` from ${message.author}` : ''} was deleted in ${
    message.channel
  }`;
}

export function messageDeleteSingleEventType(
  globalSettings: GlobalSettingsWrapper,
  channelManager: MegalogChannelManager,
  guildSettingsManager: MegalogGuildSettingsManager
): MegalogEventType<'messageDelete'> {
  return {
    name: messageDeleteSingleEventTypeName,
    description: `Logs deletions of single messages. Can use \`${attachmentSendEventType.name}\` log messages to recover attachments of deleted messages.`,
    category: messageMegalogEventCategoryName,
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
        .setFooter(`Message ID: ${message.id} | ${messageDeleteSingleEventTypeName}`)
        .setAuthor(
          message.author?.tag ?? 'Unknown',
          message.author?.displayAvatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
        );

      addContentField(embed, 'Text Content', message.content);

      const innerDescription = await generateInnerDescription(message);
      embed.setDescription(`**${innerDescription}.**`);

      const cachedAttachments =
        message.attachments.size === 0
          ? undefined
          : await getCachedAttachments(channelManager, channel.guild, message.id);

      const guildSettings = await guildSettingsManager.fetch(channel.guild);

      const condensedBuffer = !guildSettings.attachCondensedJson
        ? undefined
        : jsonToBuffer(
            condenseSingleMessageDeletion(message, cachedAttachments, dayjs().valueOf())
          );
      const partitions = !cachedAttachments
        ? undefined
        : partitionAttachments(
            cachedAttachments.array(),
            channel.guild.premiumTier,
            condensedBuffer?.byteLength
          );
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
          ...(!condensedBuffer
            ? []
            : [
                {
                  attachment: condensedBuffer,
                  name: `single-message-deletion${guildSettings.condensedFileNameEnding}`,
                },
              ]),
        ],
      });
      return async auditEntry => {
        embed.setDescription(`**${innerDescription} probably by ${auditEntry.executor}.**`);
        // The auditEntry.reason is ignored because single message deletions by bots
        // are not logged and thus no reason is ever specified.
        await logMessage.edit(embed);
      };
    },
  };
}
