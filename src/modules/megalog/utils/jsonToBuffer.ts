import {stringifyJsonPretty} from '@/utils/stringifyJsonPretty';

export function jsonToBuffer(json: unknown): Buffer {
  return Buffer.from(stringifyJsonPretty(json), 'utf8');
}
