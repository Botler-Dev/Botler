import {
  Channel,
  ExportProxyClientEvents,
  GuildAuditLogsActions,
  GuildChannel,
  TextChannel,
  VoiceChannel,
} from 'discord.js';
import {AuditLogMatchFilter} from '../auditLog/AuditLogMatcher';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedChannelClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'channelCreate' | 'channelDelete' | 'channelUpdate' | 'channelPinsUpdate'
>;

export type AuditLogSupportedChannelClientEvent = Extract<
  MegalogSupportedChannelClientEvent,
  'channelCreate' | 'channelDelete' | 'channelUpdate' | 'channelPinsUpdate'
>;

const channelToGuild = async (channel: Channel) =>
  channel instanceof GuildChannel ? channel.guild : undefined;

function channelToMatchFilter(action: keyof GuildAuditLogsActions) {
  return async (channel: Channel): Promise<AuditLogMatchFilter | undefined> => {
    if (!(channel instanceof GuildChannel)) return undefined;
    const channelId = channel.id;
    return {
      action,
      checker: entry => checkAuditLogEntryTargetId(entry, channelId),
    };
  };
}

export function registerChannelClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEventWithAuditLog(
    'channelCreate',
    channelToGuild,
    channelToMatchFilter('CHANNEL_CREATE')
  );

  utils.listenToGuildEventWithAuditLog(
    'channelDelete',
    channelToGuild,
    channelToMatchFilter('CHANNEL_DELETE')
  );

  utils.listenToGuildEventWithAuditLog(
    'channelUpdate',
    channelToGuild,
    async (oldChannel, newChannel) => {
      if (!(oldChannel instanceof GuildChannel && newChannel instanceof GuildChannel))
        return undefined;
      return {
        action: 'CHANNEL_UPDATE',
        checker: entry =>
          !!entry.target &&
          'id' in entry.target &&
          entry.target.id === oldChannel.id &&
          // Reverse the change array as new changes are at the end.
          (entry.changes?.reverse() ?? []).some(change => {
            switch (change.key) {
              case 'name':
                return oldChannel.name === change.old && newChannel.name === change.new;
              case 'position':
                return oldChannel.position === change.old && newChannel.position === change.new;
              case 'topic':
                return (
                  oldChannel instanceof TextChannel &&
                  newChannel instanceof TextChannel &&
                  oldChannel.topic === change.old &&
                  newChannel.topic === change.new
                );
              case 'bitrate':
                return (
                  oldChannel instanceof VoiceChannel &&
                  newChannel instanceof VoiceChannel &&
                  oldChannel.bitrate === change.old &&
                  newChannel.bitrate === change.new
                );
              case 'permission_overwrites':
                // We could check individual permission overwrites but that would be too expensive.
                return (
                  oldChannel.permissionOverwrites.size === change.old.length &&
                  newChannel.permissionOverwrites.size === change.new.length
                );
              case 'nsfw':
                return (
                  oldChannel instanceof TextChannel &&
                  newChannel instanceof TextChannel &&
                  oldChannel.nsfw === change.old &&
                  newChannel.nsfw === change.new
                );
              case 'rate_limit_per_user':
                return (
                  oldChannel instanceof TextChannel &&
                  newChannel instanceof TextChannel &&
                  oldChannel.rateLimitPerUser === change.old &&
                  newChannel.rateLimitPerUser === change.new
                );
              case 'application_id': // Fetching all webhooks and checking for the ids is too expensive.
              default:
                return false;
            }
          }),
      };
    }
  );

  utils.listenToGuildEventWithAuditLog('channelPinsUpdate', channelToGuild, async channel => {
    if (!(channel instanceof GuildChannel)) return undefined;
    return {
      checker: entry =>
        (entry.action === 'MESSAGE_PIN' || entry.action === 'MESSAGE_UNPIN') &&
        // Discord.js' bad typings don't properly define the extra property.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry.extra as any)?.channel?.id === channel.id,
    };
  });
}
