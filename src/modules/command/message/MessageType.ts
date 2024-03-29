import {ColorType} from '@/settings';

/**
 * Type of standardized messages a command can send.
 */
export enum MessageType {
  Neutral,
  Question,
  Success,
  Error,
  Warning,
}

export const messageEmojis = {
  [MessageType.Neutral]: '',
  [MessageType.Question]: '❔',
  [MessageType.Success]: '✅',
  [MessageType.Error]: '❌',
  [MessageType.Warning]: '⚠',
} as const;

export const messageToColorType = {
  [MessageType.Neutral]: ColorType.Default,
  [MessageType.Question]: ColorType.Default,
  [MessageType.Success]: ColorType.Good,
  [MessageType.Error]: ColorType.Bad,
  [MessageType.Warning]: ColorType.Warn,
} as const;
