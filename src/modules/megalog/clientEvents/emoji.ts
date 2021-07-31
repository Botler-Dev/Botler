import {ExportProxyClientEvents, GuildAuditLogsActions, GuildEmoji} from 'discord.js';
import {AuditLogMatchFilter} from '../auditLog/AuditLogMatcher';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedEmojiClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'emojiCreate' | 'emojiDelete' | 'emojiUpdate'
>;

export type AuditLogSupportedEmojiClientEvent = Extract<
  MegalogSupportedEmojiClientEvent,
  'emojiCreate' | 'emojiDelete' | 'emojiUpdate'
>;

const emojiToGuild = async (emoji: GuildEmoji) => emoji.guild;

function emojiToFilterMatch(action: keyof GuildAuditLogsActions) {
  return async (emoji: GuildEmoji): Promise<AuditLogMatchFilter> => {
    const emojiId = emoji.id;
    return {action, checker: entry => checkAuditLogEntryTargetId(entry, emojiId)};
  };
}

export function registerEmojiClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEvent('emojiCreate', emojiToGuild, emojiToFilterMatch('EMOJI_CREATE'));

  utils.listenToGuildEvent('emojiDelete', emojiToGuild, emojiToFilterMatch('EMOJI_DELETE'));

  utils.listenToGuildEvent('emojiUpdate', emojiToGuild, async (oldEmoji, newEmoji) => ({
    action: 'EMOJI_UPDATE',
    checker: entry =>
      checkAuditLogEntryTargetId(entry, oldEmoji.id) &&
      (entry.changes ?? []).every(change => {
        switch (change.key) {
          case 'name':
            return oldEmoji.name === change.old && newEmoji.name === change.new;
          default:
            return false;
        }
      }),
  }));
}
