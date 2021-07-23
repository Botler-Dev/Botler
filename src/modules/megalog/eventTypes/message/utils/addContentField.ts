import {MessageEmbed} from 'discord.js';

const EMBED_FIELD_MAX_LENGTH = 1024;

export function addContentField(embed: MessageEmbed, title: string, content: null | string): void {
  const length = content?.length ?? 0;
  embed.addField(
    `${title}${
      length > EMBED_FIELD_MAX_LENGTH
        ? ` (truncated to ${EMBED_FIELD_MAX_LENGTH} from ${length} characters)`
        : ''
    }`,
    (content?.slice(0, EMBED_FIELD_MAX_LENGTH) ?? '*Unknown content*') || '*No content*'
  );
}
