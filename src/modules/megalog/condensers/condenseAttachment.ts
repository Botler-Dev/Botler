import {MessageAttachment} from 'discord.js';

/**
 * Condensed {@link MessageAttachment} with optional cached urls.
 * This mirrors the [Discord API Attachment structure](https://discord.com/developers/docs/resources/channel#attachment-object-attachment-structure) closely.
 */
export interface CondensedAttachment {
  id: string;
  filename?: string;
  url: string;
  proxy_url: string;
  /**
   * Secondary url for the file if the first was deleted.
   */
  cache_url?: string;
  /**
   * Secondary proxy url for the file if the first was deleted.
   */
  cache_proxy_url?: string;
  height?: number;
  width?: number;
}

export function condenseAttachment(
  attachment: MessageAttachment,
  cachedAttachment?: MessageAttachment
): CondensedAttachment {
  return {
    id: attachment.id,
    filename: attachment.name ?? undefined,
    url: attachment.url,
    proxy_url: attachment.proxyURL,
    cache_url: cachedAttachment?.url,
    cache_proxy_url: cachedAttachment?.proxyURL,
    height: attachment.height ?? undefined,
    width: attachment.width ?? undefined,
  };
}
