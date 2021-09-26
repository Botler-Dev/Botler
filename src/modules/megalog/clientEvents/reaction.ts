import {Guild, MessageReaction, Snowflake} from 'discord.js';
import {ClientEventListenerType} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedReactionGuildClientEvent =
  | 'messageReactionAdd'
  | 'messageReactionRemove'
  | 'messageReactionRemoveAll'
  | 'messageReactionRemoveEmoji';

export type SupportedReactionAuditLogClientEvent = never;

export type SupportedReactionGlobalClientEvent = never;

const reactionToGuild = (reaction: MessageReaction): Guild | undefined =>
  reaction.message.guild ?? undefined;

const reactionToInvolvedChannel = (reaction: MessageReaction): Snowflake[] => [
  reaction.message.channel.id,
];

export const reactionClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedReactionGuildClientEvent,
  SupportedReactionAuditLogClientEvent,
  SupportedReactionGlobalClientEvent
> = {
  messageReactionAdd: {
    type: ClientEventListenerType.Guild,
    guildResolver: reactionToGuild,
    channelResolver: reactionToInvolvedChannel,
  },
  messageReactionRemove: {
    type: ClientEventListenerType.Guild,
    guildResolver: reactionToGuild,
    channelResolver: reactionToInvolvedChannel,
  },
  messageReactionRemoveAll: {
    type: ClientEventListenerType.Guild,
    guildResolver: message => message.guild ?? undefined,
    channelResolver: message => [message.channel.id],
  },
  messageReactionRemoveEmoji: {
    type: ClientEventListenerType.Guild,
    guildResolver: reactionToGuild,
    channelResolver: reactionToInvolvedChannel,
  },
};
