import {Guild, GuildAuditLogsActions, GuildEmoji} from 'discord.js';
import {AuditLogMatchFilter} from '../auditLog/AuditLogMatcher';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {ClientEventListenerType} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedEmojiGuildClientEvent = never;

export type SupportedEmojiAuditLogClientEvent = 'emojiCreate' | 'emojiDelete' | 'emojiUpdate';

export type SupportedEmojiGlobalClientEvent = never;

const emojiToGuild = (emoji: GuildEmoji): Guild => emoji.guild;

function emojiToFilterMatch(action: keyof GuildAuditLogsActions) {
  return ({id: emojiId}: GuildEmoji): AuditLogMatchFilter => ({
    action,
    checker: entry => checkAuditLogEntryTargetId(entry, emojiId),
  });
}

export const emojiClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedEmojiGuildClientEvent,
  SupportedEmojiAuditLogClientEvent,
  SupportedEmojiGlobalClientEvent
> = {
  emojiCreate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: emojiToGuild,
    filterResolver: emojiToFilterMatch('EMOJI_CREATE'),
  },
  emojiDelete: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: emojiToGuild,
    filterResolver: emojiToFilterMatch('EMOJI_DELETE'),
  },
  emojiUpdate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: emojiToGuild,
    filterResolver: (oldEmoji, newEmoji) => ({
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
    }),
  },
};
