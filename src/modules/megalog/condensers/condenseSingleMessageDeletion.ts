import {Message, PartialMessage} from 'discord.js';
import {CondensedMessage, condenseMessage} from './condenseMessage';

export interface CondensedSingleMessageDeletion extends CondensedMessage {
  deleted_timestamp: number;
}

export function condenseSingleMessageDeletion(
  message: Message | PartialMessage,
  deletedTimestamp: number
): CondensedSingleMessageDeletion {
  return {
    deleted_timestamp: deletedTimestamp,
    ...condenseMessage(message),
  };
}
