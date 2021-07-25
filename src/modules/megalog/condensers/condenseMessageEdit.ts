import {Message, PartialMessage} from 'discord.js';
import {CondensedMessageContent, condenseMessageContent} from './condenseMessageContent';

/**
 * Condensed representation of a message edit.
 */
export interface CondensedMessageEdit {
  /**
   * ID of origin channel of the edited message.
   */
  channel_id: string;
  /**
   * ID of the edited message.
   */
  message_id: string;
  /**
   * Timestamp when the edit occurred.
   */
  edited_timestamp: number;
  /**
   * Message content before the edit.
   */
  before: CondensedMessageContent;
  /**
   * Message content after the edit.
   */
  after: CondensedMessageContent;
}

export function condenseMessageEdit(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage
): CondensedMessageEdit {
  if (!newMessage.editedTimestamp)
    throw new Error(`The "editedTimestamp" needs to be defined in the new message.`);
  return {
    channel_id: oldMessage.channel.id,
    message_id: oldMessage.id,
    edited_timestamp: newMessage.editedTimestamp,
    before: condenseMessageContent(oldMessage),
    after: condenseMessageContent(newMessage),
  };
}
