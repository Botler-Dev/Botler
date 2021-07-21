/* eslint-disable unicorn/no-null */
import {ColorType, GlobalSettingsWrapper} from '@/settings';
import {MessageEmbed} from 'discord.js';
import {MessageMegalogEventCategoryName} from '.';
import {condenseMessageEdit} from '../../condensers/condenseMessageEdit';
import {MegalogEventType} from '../../eventType/MegalogEventType';
import {jsonToBuffer} from '../../utils/jsonToBuffer';
import {addContentField} from './addContentField';

const messageEditEventTypeName = 'message-edit';

export function messageEditEventType(
  globalSettings: GlobalSettingsWrapper
): MegalogEventType<'messageUpdate'> {
  return {
    name: messageEditEventTypeName,
    description: 'Logs message edits including embed and attachment edits.',
    category: MessageMegalogEventCategoryName,
    clientEventName: 'messageUpdate',
    processClientEvent: async (oldMessage, newMessage) => {
      if (oldMessage.editedTimestamp === newMessage.editedTimestamp) return undefined;
      return async channel => {
        const embed = new MessageEmbed()
          .setColor(globalSettings.getColor(ColorType.Default))
          .setTimestamp(newMessage.editedTimestamp ?? 0)
          .setFooter(`Message ID: ${newMessage.id} | ${messageEditEventTypeName}`);

        let message = newMessage;
        if (!message.author) message = await newMessage.fetch().catch(() => message);

        if (message.author) embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
        else embed.setAuthor('Unknown', 'https://cdn.discordapp.com/embed/avatars/0.png');

        if (message.webhookID) {
          const webhook = await message.fetchWebhook().catch(() => undefined);

          embed.setDescription(
            `**${
              webhook ? `The webhook **\`${webhook.name}\`**` : 'A webhook'
            } edited a message in ${message.channel}.** [Jump to Message](${message.url})`
          );
        } else if (message.author) {
          embed.setDescription(
            `**${message.author} edited a message in ${message.channel}.** [Jump to Message](${message.url})`
          );
        } else {
          embed.setDescription(
            `**A message in ${message.channel} was edited.** [Jump to Message](${message.url})`
          );
        }

        if (oldMessage.content !== newMessage.content) {
          addContentField(embed, 'Text before', oldMessage.content);
          addContentField(embed, 'Text after', newMessage.content);
        }

        const json = jsonToBuffer(condenseMessageEdit(oldMessage, newMessage));
        await channel.send({
          embed,
          files: [{attachment: json, name: 'message-edit-json'}],
        });
      };
    },
  };
}
