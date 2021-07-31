import {stringifyJsonPretty} from '@/utils/stringifyJsonPretty';

/**
 * Convert a JSON into a sendable {@link Buffer}.
 */
export function jsonToBuffer(json: unknown): Buffer {
  return Buffer.from(stringifyJsonPretty(json), 'utf8');
}
