import {
  MessageEmbed,
  MessageEmbedImage,
  MessageEmbedThumbnail,
  MessageEmbedVideo,
} from 'discord.js';

export interface CondensedEmbedFooter {
  text?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface CondensedMedia {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface CondensedEmbedProvider {
  name: string;
  url: string;
}

export interface CondensedEmbedAuthor {
  name?: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface CondensedEmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface CondensedEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: number;
  color?: number;
  footer?: CondensedEmbedFooter;
  image?: CondensedMedia;
  thumbnail?: CondensedMedia;
  video?: CondensedMedia;
  provider?: CondensedEmbedProvider;
  author?: CondensedEmbedAuthor;
  fields?: CondensedEmbedField[];
}

function condenseMedia(
  media: MessageEmbedImage | MessageEmbedThumbnail | MessageEmbedVideo | null
): CondensedMedia | undefined {
  if (!media) return undefined;
  return {
    url: media.url ?? undefined,
    proxy_url: media.proxyURL ?? undefined,
    height: media.height ?? undefined,
    width: media.width ?? undefined,
  };
}

export function condenseEmbed(embed: MessageEmbed): CondensedEmbed {
  return {
    title: embed.title ?? undefined,
    description: embed.description ?? undefined,
    url: embed.url ?? undefined,
    timestamp: embed.timestamp ?? undefined,
    color: embed.color ?? undefined,
    footer: !embed.footer
      ? undefined
      : {
          text: embed.footer.text,
          icon_url: embed.footer.iconURL,
          proxy_icon_url: embed.footer.proxyIconURL,
        },
    image: condenseMedia(embed.image),
    thumbnail: condenseMedia(embed.thumbnail),
    video: condenseMedia(embed.video),
    provider: !embed.provider
      ? undefined
      : {
          name: embed.provider.name,
          url: embed.provider.url,
        },
    author: !embed.author
      ? undefined
      : {
          name: embed.author.name,
          url: embed.author.url,
          icon_url: embed.author.iconURL,
          proxy_icon_url: embed.author.proxyIconURL,
        },
    fields:
      embed.fields.length === 0
        ? undefined
        : embed.fields.map(field => ({
            name: field.name,
            value: field.value,
            inline: field.inline,
          })),
  };
}
