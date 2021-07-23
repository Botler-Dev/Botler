import {ColorType, GlobalSettingsWrapper} from '@/settings';
import {Collection, Guild, MessageAttachment, MessageEmbed, Snowflake} from 'discord.js';
import {messageMegalogEventCategoryName} from '.';
import {MegalogEventType} from '../../eventType/MegalogEventType';
import {MegalogChannelManager} from '../../MegalogChannelManager';
import {partitionAttachments} from './utils/partitionAttachments';
import {toDiscordMegaByteString} from './utils/toDiscordMegaByteString';

const attachmentSendEventTypeName = 'attachment-send';

const generateFooter = (messageId: Snowflake) =>
  `Message ID: ${messageId} | ${attachmentSendEventTypeName}`;

export function attachmentSendEventType(
  globalSettings: GlobalSettingsWrapper
): MegalogEventType<'message'> {
  return {
    name: attachmentSendEventTypeName,
    description:
      'When someone sends a message with attachments those attachments get logged. This can be combined with the `message-delete-*` events to see attachments of deleted messages.',
    category: messageMegalogEventCategoryName,
    clientEventName: 'message',
    processClientEvent: async message => {
      if (message.attachments.size === 0) return undefined;
      return async channel => {
        if (message.author.id === message.client.user?.id && message.channel.id === channel.id)
          return;

        const partitions = partitionAttachments(
          message.attachments.array(),
          channel.guild.premiumTier
        );
        const embed = new MessageEmbed()
          .setDescription(
            `${partitions.sendable.length}/${message.attachments.size} attachment${
              partitions.sendable.length === 1 ? '' : 's'
            } (${toDiscordMegaByteString(partitions.sendableSize)}) from [a message](${
              message.url
            }) sent by ${message.author} in ${message.channel}.`
          )
          .setColor(globalSettings.getColor(ColorType.Default))
          .setTimestamp(message.createdAt)
          .setFooter(generateFooter(message.id));
        if (partitions.unsendable.length > 0)
          embed.addField(
            `Omitted attachments [${partitions.unsendable.length}]`,
            partitions.unsendable
              .map(
                attachment =>
                  `[${attachment.name ?? 'unnamed'}](${attachment.url}) - ${toDiscordMegaByteString(
                    attachment.size
                  )}`
              )
              .join('\n')
          );
        await channel.send({
          embed,
          files: partitions.sendable,
        });
      };
    },
  };
}

export type CachedAttachments = Collection<string, MessageAttachment>;

export async function getCachedAttachments(
  channelManager: MegalogChannelManager,
  guild: Guild,
  messageId: Snowflake
): Promise<CachedAttachments | undefined> {
  const logChannel = channelManager.getChannel(attachmentSendEventTypeName, guild);
  if (!logChannel) return undefined;
  const messages = await logChannel.messages.fetch({limit: 20, around: messageId});
  const targetFooter = generateFooter(messageId);
  const logMessage = messages.find(
    message => message.embeds.find(embed => embed.type === 'rich')?.footer?.text === targetFooter
  );
  if (!logMessage) return undefined;
  const cached: CachedAttachments = new Collection();
  logMessage.attachments.forEach(attachment => {
    if (!attachment.name) return;
    cached.set(attachment.name, attachment);
  });
  return cached;
}
