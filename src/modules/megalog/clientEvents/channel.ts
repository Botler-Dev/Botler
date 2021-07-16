import {
  Channel,
  ExportProxyClientEvents,
  GuildAuditLogsActions,
  GuildChannel,
  GuildMember,
  Role,
  TextChannel,
  VoiceChannel,
  Webhook,
} from 'discord.js';
import {AuditLogMatchFilter} from '../auditLog/AuditLogMatcher';
import {checkAuditLogEntryTargetId} from './utils/checkAuditLogEntryTargetId';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedChannelClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'channelCreate' | 'channelDelete' | 'channelUpdate' | 'channelPinsUpdate' | 'webhookUpdate'
>;

export type AuditLogSupportedChannelClientEvent = Extract<
  MegalogSupportedChannelClientEvent,
  'channelCreate' | 'channelDelete' | 'channelUpdate' | 'channelPinsUpdate' | 'webhookUpdate'
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

enum ChannelType {
  text = 0,
  voice = 2,
  category = 4,
  news = 5,
  store = 6,
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
        checker: entry => {
          if (!checkAuditLogEntryTargetId(entry, oldChannel.id)) return false;
          switch (entry.action) {
            case 'CHANNEL_UPDATE':
              return (entry.changes ?? []).every(change => {
                switch (change.key) {
                  case 'name':
                    return oldChannel.name === change.old && newChannel.name === change.new;
                  case 'position':
                    return oldChannel.position === change.old && newChannel.position === change.new;
                  case 'topic':
                    return (
                      oldChannel instanceof TextChannel &&
                      newChannel instanceof TextChannel &&
                      (oldChannel.topic ?? undefined) === change.old &&
                      (newChannel.topic ?? undefined) === change.new
                    );
                  case 'bitrate':
                    return (
                      oldChannel instanceof VoiceChannel &&
                      newChannel instanceof VoiceChannel &&
                      oldChannel.bitrate === change.old &&
                      newChannel.bitrate === change.new
                    );
                  case 'permission_overwrites':
                    // Tough listed in the docs, strangely this key never appears in the audit log.
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
                  case 'application_id':
                    // Fetching all webhooks to check would be too expensive
                    return true;
                  case 'rate_limit_per_user':
                    return (
                      oldChannel instanceof TextChannel &&
                      newChannel instanceof TextChannel &&
                      oldChannel.rateLimitPerUser === change.old &&
                      newChannel.rateLimitPerUser === change.new
                    );
                  case 'type':
                    return (
                      ChannelType[oldChannel.type] === change.old &&
                      ChannelType[newChannel.type] === change.new
                    );
                  default:
                    return false;
                }
              });
            case 'CHANNEL_OVERWRITE_CREATE': {
              const entity = entry.extra as Role | GuildMember;
              return (
                !oldChannel.permissionOverwrites.has(entity.id) &&
                // Checking the actual deny and allow permissions would be possible but it is 0 in most cases anyway.
                newChannel.permissionOverwrites.has(entity.id)
              );
            }
            case 'CHANNEL_OVERWRITE_UPDATE': {
              const entity = entry.extra as Role | GuildMember;
              const oldPermissions = oldChannel.permissionOverwrites.get(entity.id);
              const newPermissions = newChannel.permissionOverwrites.get(entity.id);
              if (!oldPermissions || !newPermissions) return false;
              return (entry.changes ?? []).every(change => {
                switch (change.key) {
                  case 'deny':
                    return (
                      oldPermissions.deny.bitfield === change.old &&
                      newPermissions.deny.bitfield === change.new
                    );
                  case 'allow':
                    return (
                      oldPermissions.allow.bitfield === change.old &&
                      newPermissions.allow.bitfield === change.new
                    );
                  // The legacy fields are easier to compare so we are using them.
                  case 'deny_new':
                  case 'allow_new':
                    return true;
                  default:
                    return false;
                }
              });
            }
            case 'CHANNEL_OVERWRITE_DELETE': {
              const entity = entry.extra as Role | GuildMember;
              return (
                oldChannel.permissionOverwrites.has(entity.id) &&
                !newChannel.permissionOverwrites.has(entity.id)
              );
            }
            default:
              return false;
          }
        },
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

  utils.listenToGuildEventWithAuditLog('webhookUpdate', channelToGuild, async channel => ({
    // Proper checking would require manually fetching the webhooks.
    // The minimal gain in accuracy is not be worth it.
    checker: entry =>
      (entry.action === 'WEBHOOK_UPDATE' ||
        entry.action === 'WEBHOOK_CREATE' ||
        entry.action === 'WEBHOOK_DELETE') &&
      entry.target instanceof Webhook &&
      entry.target.channelID === channel.id,
  }));
}
