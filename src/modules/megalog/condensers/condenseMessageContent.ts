import {Message, PartialMessage} from 'discord.js';
import {CachedAttachments} from '../eventTypes/message/attachmentSendEventType';
import {condenseAttachment, CondensedAttachment} from './condenseAttachment';
import {CondensedEmbed, condenseEmbed} from './condenseEmbed';

/**
 * Condensed content of a {@link Message}.
 * Partially mirrors the [Discord API Message structure](https://discord.com/developers/docs/resources/channel#message-object-message-structure)
 */
export interface CondensedMessageContent {
  /**
   * If the message was only partially loaded when condensed.
   */
  partial: boolean;
  content?: string;
  embeds?: CondensedEmbed[];
  attachments?: CondensedAttachment[];
}

export function condenseMessageContent(
  message: Message | PartialMessage,
  cachedAttachments?: CachedAttachments
): CondensedMessageContent {
  return {
    partial: message.partial,
    content: message.content ?? undefined,
    embeds:
      message.embeds.length === 0
        ? undefined
        : message.embeds.filter(embed => embed.type === 'rich').map(embed => condenseEmbed(embed)),
    attachments:
      message.attachments.size === 0
        ? undefined
        : message.attachments.map(attachment =>
            condenseAttachment(
              attachment,
              !attachment.name ? undefined : cachedAttachments?.get(attachment.name)
            )
          ),
  };
}
