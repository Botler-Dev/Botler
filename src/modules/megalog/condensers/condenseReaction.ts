import {MessageReaction} from 'discord.js';

/**
 * Condensed {@link MessageReaction}.
 * Partially mirrors the [Discord API Reaction structure](https://discord.com/developers/docs/resources/channel#reaction-object).
 */
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
