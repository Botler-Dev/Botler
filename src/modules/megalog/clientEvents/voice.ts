import {ExportProxyClientEvents} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedVoiceClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'voiceStateUpdate'
>;

export type AuditLogSupportedVoiceClientEvent = Extract<
  MegalogSupportedVoiceClientEvent,
  'voiceStateUpdate'
>;

export function registerVoiceClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEventWithAuditLog(
    'voiceStateUpdate',
    async state => state.guild,
    async (oldState, newState) => ({
      checker: entry => {
        switch (entry.action) {
          case 'MEMBER_DISCONNECT':
            return !!oldState.channel && !newState.channel;
          case 'MEMBER_MOVE': {
            // Discord.js' bad typings do not define the extra type properly.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const destinationId = (entry.extra as any)?.channel?.id;
            return oldState.channel?.id !== destinationId && newState.channel?.id === destinationId;
          }
          case 'MEMBER_UPDATE':
            return (
              checkAuditLogEntryTargetId(entry, oldState.member?.id) &&
              (entry.changes ?? []).every(change => {
                switch (change.key) {
                  case 'deaf':
                    return (
                      (oldState.serverDeaf ?? undefined) === change.old &&
                      (newState.serverDeaf ?? undefined) === change.new
                    );
                  case 'mute':
                    return (
                      (oldState.serverMute ?? undefined) === change.old &&
                      (newState.serverMute ?? undefined) === change.new
                    );
                  default:
                    return false;
                }
              })
            );
          default:
            return false;
        }
      },
    })
  );
}
