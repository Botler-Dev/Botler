import {ExportProxyClientEvents, Guild, Invite} from 'discord.js';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedGuildClientEvent = Extract<
  keyof ExportProxyClientEvents,
  'guildIntegrationsUpdate' | 'guildUpdate' | 'inviteCreate' | 'inviteDelete'
>;

export type AuditLogSupportedGuildClientEvent = Extract<
  MegalogSupportedGuildClientEvent,
  'guildIntegrationsUpdate' | 'guildUpdate' | 'inviteCreate' | 'inviteDelete'
>;

const guildToGuild = async (guild: Guild) => guild;

enum DefaultMessageNotifications {
  ALL = 0,
  MENTIONS = 1,
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

const inviteToGuild = async (invite: Invite) => invite.guild ?? undefined;

export function registerGuildClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGuildEventWithAuditLog(
    'guildIntegrationsUpdate',
    guildToGuild,
    // Strangely this client event only fires when a bot gets kicked.
    async () => ({action: 'INTEGRATION_DELETE'})
  );

  utils.listenToGuildEventWithAuditLog('guildUpdate', guildToGuild, async (oldGuild, newGuild) => ({
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
            return oldGuild.ownerID === change.old && newGuild.ownerID === change.new;
          case 'region':
            return oldGuild.region === change.old && newGuild.region === change.new;
          case 'preferred_locale':
            return (
              oldGuild.preferredLocale === change.old && newGuild.preferredLocale === change.new
            );
          case 'afk_channel_id':
            return (
              (oldGuild.afkChannelID ?? undefined) === change.old &&
              (newGuild.afkChannelID ?? undefined) === change.new
            );
          case 'afk_timeout':
            return oldGuild.afkTimeout === change.old && newGuild.afkTimeout === change.new;
          case 'rules_channel_id':
            return (
              (oldGuild.rulesChannelID ?? undefined) === change.old &&
              (newGuild.rulesChannelID ?? undefined) === change.new
            );
          case 'public_updates_channel_id':
            return (
              (oldGuild.publicUpdatesChannelID ?? undefined) === change.old &&
              (newGuild.publicUpdatesChannelID ?? undefined) === change.new
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
          // Both add and remove seemingly don't get used anymore.
          case '$add':
            return (
              !oldGuild.roles.cache.has(change.new?.id) && newGuild.roles.cache.has(change.new?.id)
            );
          case '$remove':
            return (
              oldGuild.roles.cache.has(change.new?.id) && !newGuild.roles.cache.has(change.new?.id)
            );
          case 'prune_delete_days':
            // Cannot find any relating guild setting that would be changed.
            return true;
          case 'widget_enabled':
            return (
              (oldGuild.widgetEnabled ?? undefined) === change.old &&
              (newGuild.widgetEnabled ?? undefined) === change.new
            );
          case 'widget_channel_id':
            return (
              (oldGuild.widgetChannelID ?? undefined) === change.old &&
              (newGuild.widgetChannelID ?? undefined) === change.new
            );
          case 'system_channel_id':
            return (
              (oldGuild.systemChannelID ?? undefined) === change.old &&
              (newGuild.systemChannelID ?? undefined) === change.new
            );
          default:
            return false;
        }
      }),
  }));

  utils.listenToGuildEventWithAuditLog('inviteCreate', inviteToGuild, async invite => ({
    action: 'INVITE_CREATE',
    checker: entry => entry.changes?.find(change => change.key === 'code')?.new === invite.code,
  }));

  utils.listenToGuildEventWithAuditLog('inviteDelete', inviteToGuild, async invite => ({
    action: 'INVITE_DELETE',
    checker: entry => entry.changes?.find(change => change.key === 'code')?.old === invite.code,
  }));
}
