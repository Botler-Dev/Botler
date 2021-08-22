/* eslint-disable unicorn/no-null */
import {ColorType, GlobalSettingsWrapper} from '@/settings';
import {Message, MessageEmbed, PartialMessage} from 'discord.js';
import {messageMegalogEventCategoryName} from '.';
import {condenseMessageEdit} from '../../condensers/condenseMessageEdit';
import {MegalogEventType} from '../../eventType/MegalogEventType';
import {MegalogGuildSettingsManager} from '../../guildSettings/MegalogGuildSettingsManager';
import {MegalogSubscriptionManager} from '../../MegalogSubscriptionManager';
import {jsonToBuffer} from '../../utils/jsonToBuffer';
import {addContentField} from './utils/addContentField';

const messageEditEventTypeName = 'message-edit';

async function generateDescription(message: Message | PartialMessage) {
  let innerDescription: string;
  if (message.webhookID) {
    const webhook = await message.fetchWebhook().catch(() => undefined);
    innerDescription = `${
      webhook ? `The webhook **\`${webhook.name}\`**` : 'A webhook'
    } edited a message in ${message.channel}`;
  } else if (message.author) {
    innerDescription = `${message.author} edited a message in ${message.channel}`;
  } else {
    innerDescription = `A message in ${message.channel} was edited`;
  }
  return `**${innerDescription}.** [Jump to Message](${message.url})`;
}

export function messageEditEventType(
  globalSettings: GlobalSettingsWrapper,
  guildSettingsManager: MegalogGuildSettingsManager,
  subscriptionManager: MegalogSubscriptionManager
): MegalogEventType<'messageUpdate'> {
  return {
    name: messageEditEventTypeName,
    description: 'Logs message edits including embed and attachment edits.',
    category: messageMegalogEventCategoryName,
    clientEventName: 'messageUpdate',
    processClientEvent: async (oldMessage, newMessage) => {
      if (
        oldMessage.editedTimestamp === newMessage.editedTimestamp ||
        (oldMessage.author &&
          oldMessage.author.id === oldMessage.client.user?.id &&
          subscriptionManager.channelHasSubscriptions(oldMessage.channel))
      )
        return undefined;
      return async channel => {
        let message = newMessage;
        if (!message.author) message = await newMessage.fetch().catch(() => message);

        const embed = new MessageEmbed()
          .setColor(globalSettings.getColor(ColorType.Default))
          .setTimestamp(newMessage.editedTimestamp ?? 0)
          .setDescription(await generateDescription(message))
          .setFooter(`Message ID: ${message.id} | ${messageEditEventTypeName}`)
          .setAuthor(
            message.author?.tag ?? 'Unknown',
            message.author?.displayAvatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
          );

        if (oldMessage.content !== newMessage.content) {
          addContentField(embed, 'Text before', oldMessage.content);
          addContentField(embed, 'Text after', newMessage.content);
        }

        const guildSettings = await guildSettingsManager.fetch(channel.guild);
        await channel.send({
          embed,
          files: !guildSettings.attachCondensedJson
            ? []
            : [
                {
                  attachment: jsonToBuffer(condenseMessageEdit(oldMessage, newMessage)),
                  name: `message-edit${guildSettings.condensedFileNameEnding}`,
                },
              ],
        });
      };
    },
  };
}
