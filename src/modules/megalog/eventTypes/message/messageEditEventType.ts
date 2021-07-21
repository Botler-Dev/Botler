/* eslint-disable unicorn/no-null */
import {ColorType, GlobalSettingsWrapper} from '@/settings';
import dayjs from 'dayjs';
import {
  Message,
  MessageEmbed,
  MessageEmbedImage,
  MessageEmbedThumbnail,
  MessageEmbedVideo,
  PartialMessage,
  Webhook,
} from 'discord.js';
import {MessageMegalogEventCategoryName} from '.';
import {MegalogEventType} from '../../eventType/MegalogEventType';

const EMBED_FIELD_MAX_LENGTH = 1024;

function addContentField(embed: MessageEmbed, before: boolean, content: null | string): void {
  const length = content?.length ?? 0;
  embed.addField(
    `Text ${before ? 'before' : 'after'}${
      length > EMBED_FIELD_MAX_LENGTH
        ? ` (truncated to ${EMBED_FIELD_MAX_LENGTH} from ${length} characters)`
        : ''
    }`,
    (content?.slice(0, EMBED_FIELD_MAX_LENGTH) ?? '*Unknown content*') || '*No content*'
  );
}

function condenseMedia(
  media: MessageEmbedImage | MessageEmbedThumbnail | MessageEmbedVideo | null
) {
  if (!media) return undefined;
  return {
    url: media.url ?? undefined,
    proxy_url: media.proxyURL ?? undefined,
    height: media.height ?? undefined,
    width: media.width ?? undefined,
  };
}

function condenseMessage(message: Message | PartialMessage) {
  if (message.partial) return null;
  return {
    content: message.content,
    embeds:
      message.embeds.length === 0
        ? undefined
        : message.embeds
            .filter(embed => embed.type === 'rich')
            .map(embed => ({
              title: embed.title ?? undefined,
              description: embed.description ?? undefined,
              url: embed.url ?? undefined,
              timestamp:
                embed.timestamp === null ? undefined : dayjs(embed.timestamp).toISOString(),
              color: embed.color ?? undefined,
              footer: !embed.footer
                ? undefined
                : {
                    text: embed.footer.text,
                    icon_url: embed.footer.iconURL,
                    proxy_icon_url: embed.footer.proxyIconURL,
                  },
              image: condenseMedia(embed.image),
              thumbnail: condenseMedia(embed.thumbnail),
              video: condenseMedia(embed.video),
              provider: !embed.provider
                ? undefined
                : {
                    name: embed.provider.name,
                    url: embed.provider.url,
                  },
              author: !embed.author
                ? undefined
                : {
                    name: embed.author.name,
                    url: embed.author.url,
                    icon_url: embed.author.iconURL,
                    proxy_icon_url: embed.author.proxyIconURL,
                  },
              fields:
                embed.fields.length === 0
                  ? undefined
                  : embed.fields.map(field => ({
                      name: field.name,
                      value: field.value,
                      inline: field.inline,
                    })),
            })),
    attachments:
      message.attachments.size === 0
        ? undefined
        : message.attachments.map(attachment => ({
            id: attachment.id,
            filename: attachment.name ?? undefined,
            url: attachment.url,
            proxy_url: attachment.proxyURL,
            height: attachment.height ?? undefined,
            width: attachment.width ?? undefined,
          })),
  };
}

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
          const webhook: Webhook | undefined = await message.fetchWebhook().catch(() => undefined);

          embed.setDescription(
            `**${
              webhook ? `The webhook** \`${webhook.name}\`**` : 'A webhook'
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
          addContentField(embed, true, oldMessage.content);
          addContentField(embed, false, newMessage.content);
        }

        const json = JSON.stringify(
          {
            message_id: oldMessage.id,
            edit_timestamp: newMessage.editedTimestamp,
            before: condenseMessage(oldMessage),
            after: condenseMessage(newMessage),
          },
          undefined,
          2
        );
        await channel.send({
          embed,
          files: [{attachment: Buffer.from(json, 'utf8'), name: 'message-edit-json'}],
        });
      };
    },
  };
}
