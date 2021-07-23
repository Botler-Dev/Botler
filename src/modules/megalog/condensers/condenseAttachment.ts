import {MessageAttachment} from 'discord.js';

export interface CondensedAttachment {
  id: string;
  filename?: string;
  url: string;
  proxy_url: string;
  cache_url?: string;
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
