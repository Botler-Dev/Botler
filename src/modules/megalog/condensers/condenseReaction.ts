import {MessageReaction} from 'discord.js';

export interface CondensedReaction {
  emoji: string;
  count?: number;
}

export function condenseReaction(reaction: MessageReaction): CondensedReaction {
  return {
    emoji: reaction.emoji.id ?? reaction.emoji.name,
    count: reaction.count ?? undefined,
  };
}
