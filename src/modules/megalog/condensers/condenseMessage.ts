import {Message, PartialMessage} from 'discord.js';
import {CondensedMessageContent, condenseMessageContent} from './condenseMessageContent';
import {CondensedReaction, condenseReaction} from './condenseReaction';

export interface CondensedMessage extends CondensedMessageContent {
  id: string;
  channel_id: string;
  author_id?: string;
  webhook_id?: string;
  timestamp: number;
  edited_timestamp?: number;
  reactions?: CondensedReaction[];
}

export function condenseMessage(message: Message | PartialMessage): CondensedMessage {
  return {
    id: message.id,
    channel_id: message.channel.id,
    author_id: message.author?.id,
    webhook_id: message.webhookID ?? undefined,
    timestamp: message.createdTimestamp,
    edited_timestamp: message.editedTimestamp ?? undefined,
    reactions:
      message.reactions.cache.size === 0
        ? undefined
        : message.reactions.cache.map(reaction => condenseReaction(reaction)),
    ...condenseMessageContent(message),
  };
}
