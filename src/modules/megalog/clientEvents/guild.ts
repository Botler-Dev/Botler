import {Guild, Invite, Snowflake} from 'discord.js';
import {ClientEventListenerType} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedGuildGuildClientEvent = never;

export type SupportedGuildAuditLogClientEvent =
  | 'guildIntegrationsUpdate'
  | 'guildUpdate'
  | 'inviteCreate'
  | 'inviteDelete';

export type SupportedGuildGlobalClientEvent = never;

const guildToGuild = (guild: Guild): Guild => guild;

enum DefaultMessageNotifications {
  ALL_MESSAGES = 0,
  ONLY_MENTIONS = 1,
}

function getValueOfDefaultMessageNotifications(
  value: number | keyof typeof DefaultMessageNotifications
): number {
  if (typeof value === 'number') return value;
  return DefaultMessageNotifications[value];
}

enum VerificationLevels {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  VERY_HIGH = 4,
}

enum ExplicitContentFilterLevels {
  DISABLED = 0,
  MEMBERS_WITHOUT_ROLES = 1,
  ALL_MEMBERS = 2,
}

const inviteToGuild = (invite: Invite): Guild | undefined =>
  invite.guild instanceof Guild ? invite.guild : undefined;

const inviteToInvolvedChannel = (invite: Invite): Snowflake[] => [invite.channel.id];

export const guildClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedGuildGuildClientEvent,
  SupportedGuildAuditLogClientEvent,
  SupportedGuildGlobalClientEvent
> = {
  guildIntegrationsUpdate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: guildToGuild,
    // Strangely this client event only fires when a bot gets kicked.
    filterResolver: () => ({action: 'INTEGRATION_DELETE'}),
  },
  guildUpdate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: guildToGuild,
    filterResolver: (oldGuild, newGuild) => ({
      action: 'GUILD_UPDATE',
      checker: entry =>
        (entry.changes ?? []).every(change => {
          switch (change.key) {
            case 'name':
              return oldGuild.name === change.old && newGuild.name === change.new;
            case 'description':
              return oldGuild.description === change.old && newGuild.description === change.new;
            case 'icon_hash':
              return (
                (oldGuild.icon ?? undefined) === change.old &&
                (newGuild.icon ?? undefined) === change.new
              );
            case 'splash_hash':
              // TODO: test on guild with a splash screen
              return (
                (oldGuild.splash ?? undefined) === change.old &&
                (newGuild.splash ?? undefined) === change.new
              );
            case 'discovery_splash_hash':
              // TODO: test on guild with discovery
              return (
                (oldGuild.discoverySplash ?? undefined) === change.old &&
                (newGuild.discoverySplash ?? undefined) === change.new
              );
            case 'banner_hash':
              // TODO: test on guild with a banner
              return (
                (oldGuild.banner ?? undefined) === change.old &&
                (newGuild.banner ?? undefined) === change.new
              );
            case 'owner_id':
              return oldGuild.ownerId === change.old && newGuild.ownerId === change.new;
            case 'region':
              // Comparable property was removed in Discord.js v13
              return true;
            case 'preferred_locale':
              return (
                oldGuild.preferredLocale === change.old && newGuild.preferredLocale === change.new
              );
            case 'afk_channel_id':
              return (
                (oldGuild.afkChannelId ?? undefined) === change.old &&
                (newGuild.afkChannelId ?? undefined) === change.new
              );
            case 'afk_timeout':
              return oldGuild.afkTimeout === change.old && newGuild.afkTimeout === change.new;
            case 'rules_channel_id':
              return (
                (oldGuild.rulesChannelId ?? undefined) === change.old &&
                (newGuild.rulesChannelId ?? undefined) === change.new
              );
            case 'public_updates_channel_id':
              return (
                (oldGuild.publicUpdatesChannelId ?? undefined) === change.old &&
                (newGuild.publicUpdatesChannelId ?? undefined) === change.new
              );
            case 'mfa_level':
              return oldGuild.mfaLevel === change.old && newGuild.mfaLevel === change.new;
            case 'verification_level':
              return (
                VerificationLevels[oldGuild.verificationLevel] === change.old &&
                VerificationLevels[newGuild.verificationLevel] === change.new
              );
            case 'explicit_content_filter':
              return (
                ExplicitContentFilterLevels[oldGuild.explicitContentFilter] === change.old &&
                ExplicitContentFilterLevels[newGuild.explicitContentFilter] === change.new
              );
            case 'default_message_notifications':
              return (
                getValueOfDefaultMessageNotifications(oldGuild.defaultMessageNotifications) ===
                  change.old &&
                getValueOfDefaultMessageNotifications(newGuild.defaultMessageNotifications) ===
                  change.new
              );
            case 'vanity_url_code':
              // TODO: test on guild with a vanity url
              return (
                (oldGuild.vanityURLCode ?? undefined) === change.old &&
                (newGuild.vanityURLCode ?? undefined) === change.new
              );
            // Both add and remove don't get used anymore.
            case '$add':
            case '$remove':
            // Could not find any relating guild setting that would be changed.
            case 'prune_delete_days':
              return true;
            case 'widget_enabled':
              return (
                (oldGuild.widgetEnabled ?? undefined) === change.old &&
                (newGuild.widgetEnabled ?? undefined) === change.new
              );
            case 'widget_channel_id':
              return (
                (oldGuild.widgetChannelId ?? undefined) === change.old &&
                (newGuild.widgetChannelId ?? undefined) === change.new
              );
            case 'system_channel_id':
              return (
                (oldGuild.systemChannelId ?? undefined) === change.old &&
                (newGuild.systemChannelId ?? undefined) === change.new
              );
            default:
              return false;
          }
        }),
    }),
  },
  inviteCreate: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: inviteToGuild,
    channelResolver: inviteToInvolvedChannel,
    filterResolver: invite => ({
      action: 'INVITE_CREATE',
      checker: entry => entry.changes?.find(change => change.key === 'code')?.new === invite.code,
    }),
  },
  inviteDelete: {
    type: ClientEventListenerType.AuditLog,
    guildResolver: inviteToGuild,
    channelResolver: inviteToInvolvedChannel,
    filterResolver: invite => ({
      action: 'INVITE_DELETE',
      checker: entry => entry.changes?.find(change => change.key === 'code')?.old === invite.code,
    }),
  },
};
