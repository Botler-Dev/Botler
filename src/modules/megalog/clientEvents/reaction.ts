import {ExportProxyClientEvents, MessageReaction} from 'discord.js';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedReactionClientEvent = Extract<
  keyof ExportProxyClientEvents,
  | 'messageReactionAdd'
  | 'messageReactionRemove'
  | 'messageReactionRemoveAll'
  | 'messageReactionRemoveEmoji'
>;

export type AuditLogSupportedReactionClientEvent = Extract<
  MegalogSupportedReactionClientEvent,
  never
>;

const reactionToGuild = async (reaction: MessageReaction) => reaction.message.guild ?? undefined;

export function registerReactionClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEvent('messageReactionAdd', reactionToGuild);

  utils.listenToGuildEvent('messageReactionRemove', reactionToGuild);

  utils.listenToGuildEvent('messageReactionRemoveAll', async message => message.guild ?? undefined);

  utils.listenToGuildEvent('messageReactionRemoveEmoji', reactionToGuild);
}
