/**
 * Converts byte count into mebibyte count and returns a `0.00MB` string.
 * Discord wrongly shortens mebibyte to MB so this function will to.
 */
export function toDiscordMegaByteString(size: number): string {
  return `${Math.round((size / 2 ** 20 + Number.EPSILON) * 100) / 100}MB`;
}
