import {ColorType, GlobalSettingsWrapper} from '@/settings';
import dayjs from 'dayjs';
import {MessageEmbed} from 'discord.js';
import {MessageMegalogEventCategoryName} from '.';
import {condenseSingleMessageDeletion} from '../../condensers/condenseSingleMessageDeletion';
import {MegalogEventType} from '../../eventType/MegalogEventType';
import {jsonToBuffer} from '../../utils/jsonToBuffer';
import {addContentField} from './addContentField';

const messageDeleteSingleEventTypeName = 'message-delete-single';

export function messageDeleteSingleEventType(
  globalSettings: GlobalSettingsWrapper
): MegalogEventType<'messageDelete'> {
  return {
    name: messageDeleteSingleEventTypeName,
    description: 'Logs deletions of single messages. Ignores bulk deletions.',
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

      // TODO: add cached attachment logic

      const json = jsonToBuffer(condenseSingleMessageDeletion(message, dayjs().valueOf()));
      const logMessage = await channel.send({
        embed,
        files: [{attachment: json, name: 'single-message-deletion-json'}],
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
