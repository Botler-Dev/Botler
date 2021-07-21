import {Message, PartialMessage} from 'discord.js';
import {CondensedMessageContent, condenseMessageContent} from './condenseMessageContent';

export interface CondensedMessageEdit {
  channel_id: string;
  message_id: string;
  edited_timestamp: number;
  before: CondensedMessageContent;
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
