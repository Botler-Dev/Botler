import {Snowflake} from 'discord.js';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {ClientEventListenerType} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedVoiceGuildClientEvent = never;

export type SupportedVoiceAuditLogClientEvent = 'voiceStateUpdate';

export type SupportedVoiceGlobalClientEvent = never;

export const voiceClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedVoiceGuildClientEvent,
  SupportedVoiceAuditLogClientEvent,
  SupportedVoiceGlobalClientEvent
> = {
  voiceStateUpdate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: oldState => oldState.guild,
    channelResolver: (oldState, newState) =>
      [oldState.channel?.id, newState.channel?.id].filter(
        (id): id is Snowflake => id !== undefined
      ),
    filterResolver: (oldState, newState) => ({
      checker: entry => {
        switch (entry.action) {
          case 'MEMBER_DISCONNECT':
            return !!oldState.channel && !newState.channel;
          case 'MEMBER_MOVE': {
            // Discord.js' bad typings do not define the extra type properly.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const destinationId: Snowflake = (entry.extra as any)?.channel?.id;
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
    }),
  },
};
