import {Message, PartialMessage} from 'discord.js';
import {CachedAttachments} from '../eventTypes/message/attachmentSendEventType';
import {CondensedMessage, condenseMessage} from './condenseMessage';

/**
 * Condensed representation of a message deletion.
 */
export interface CondensedSingleMessageDeletion extends CondensedMessage {
  /**
   * Timestamp when the message was deleted.
   */
  deleted_timestamp: number;
}

export function condenseSingleMessageDeletion(
  message: Message | PartialMessage,
  cachedAttachments: CachedAttachments | undefined,
  deletedTimestamp: number
): CondensedSingleMessageDeletion {
  return {
    deleted_timestamp: deletedTimestamp,
    ...condenseMessage(message, cachedAttachments),
  };
}
