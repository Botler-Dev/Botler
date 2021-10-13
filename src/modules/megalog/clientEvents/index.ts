import {Logger} from '@/logger';
import {Client} from 'discord.js';
import {AuditLogMatcher} from '../auditLog/AuditLogMatcher';
import type {MegalogEventTypeManager} from '../eventType/MegalogEventTypeManager';
import {MegalogIgnoreManager} from '../MegalogIgnoreManager';
import type {MegalogSubscriptionManager} from '../MegalogSubscriptionManager';
import {
  ClientEventSubscriptions,
  createClientEventListeners,
} from './utils/createClientEventListeners';
import {
  banClientEventListenerDefinitions,
  SupportedBanAuditLogClientEvent,
  SupportedBanGlobalClientEvent,
  SupportedBanGuildClientEvent,
} from './ban';
import {
  channelClientEventListenerDefinitions,
  SupportedChannelAuditLogClientEvent,
  SupportedChannelGlobalClientEvent,
  SupportedChannelGuildClientEvent,
} from './channel';
import {
  emojiClientEventListenerDefinitions,
  SupportedEmojiAuditLogClientEvent,
  SupportedEmojiGlobalClientEvent,
  SupportedEmojiGuildClientEvent,
} from './emoji';
import {
  guildClientEventListenerDefinitions,
  SupportedGuildAuditLogClientEvent,
  SupportedGuildGlobalClientEvent,
  SupportedGuildGuildClientEvent,
} from './guild';
import {
  memberClientEventListenerDefinitions,
  SupportedMemberAuditLogClientEvent,
  SupportedMemberGlobalClientEvent,
  SupportedMemberGuildClientEvent,
} from './member';
import {
  messageClientEventListenerDefinitions,
  SupportedMessageAuditLogClientEvent,
  SupportedMessageGlobalClientEvent,
  SupportedMessageGuildClientEvent,
} from './message';
import {
  reactionClientEventListenerDefinitions,
  SupportedReactionAuditLogClientEvent,
  SupportedReactionGlobalClientEvent,
  SupportedReactionGuildClientEvent,
} from './reaction';
import {
  roleClientEventListenerDefinitions,
  SupportedRoleAuditLogClientEvent,
  SupportedRoleGlobalClientEvent,
  SupportedRoleGuildClientEvent,
} from './role';
import {
  SupportedUserAuditLogClientEvent,
  SupportedUserGlobalClientEvent,
  SupportedUserGuildClientEvent,
  userClientEventListenerDefinitions,
} from './user';
import {
  SupportedVoiceAuditLogClientEvent,
  SupportedVoiceGlobalClientEvent,
  SupportedVoiceGuildClientEvent,
  voiceClientEventListenerDefinitions,
} from './voice';

export type MegalogSupportedClientEvent =
  | MegalogSupportedGuildClientEvent
  | MegalogSupportedAuditLogClientEvent
  | MegalogSupportedGlobalClientEvent;

export type MegalogSupportedGuildClientEvent =
  | SupportedBanGuildClientEvent
  | SupportedChannelGuildClientEvent
  | SupportedEmojiGuildClientEvent
  | SupportedGuildGuildClientEvent
  | SupportedMemberGuildClientEvent
  | SupportedMessageGuildClientEvent
  | SupportedReactionGuildClientEvent
  | SupportedRoleGuildClientEvent
  | SupportedUserGuildClientEvent
  | SupportedVoiceGuildClientEvent;

export type MegalogSupportedAuditLogClientEvent =
  | SupportedBanAuditLogClientEvent
  | SupportedChannelAuditLogClientEvent
  | SupportedEmojiAuditLogClientEvent
  | SupportedGuildAuditLogClientEvent
  | SupportedMemberAuditLogClientEvent
  | SupportedMessageAuditLogClientEvent
  | SupportedReactionAuditLogClientEvent
  | SupportedRoleAuditLogClientEvent
  | SupportedUserAuditLogClientEvent
  | SupportedVoiceAuditLogClientEvent;

export type MegalogSupportedGlobalClientEvent =
  | SupportedBanGlobalClientEvent
  | SupportedChannelGlobalClientEvent
  | SupportedEmojiGlobalClientEvent
  | SupportedGuildGlobalClientEvent
  | SupportedMemberGlobalClientEvent
  | SupportedMessageGlobalClientEvent
  | SupportedReactionGlobalClientEvent
  | SupportedRoleGlobalClientEvent
  | SupportedUserGlobalClientEvent
  | SupportedVoiceGlobalClientEvent;

export function registerClientEventListeners(
  client: Client,
  logger: Logger,
  subscriptionManager: MegalogSubscriptionManager,
  eventTypeManager: MegalogEventTypeManager,
  ignoreManager: MegalogIgnoreManager,
  auditLogMatcher: AuditLogMatcher
): ClientEventSubscriptions {
  return createClientEventListeners<
    MegalogSupportedGuildClientEvent,
    MegalogSupportedAuditLogClientEvent,
    MegalogSupportedGlobalClientEvent
  >(client, logger, subscriptionManager, eventTypeManager, ignoreManager, auditLogMatcher, {
    ...banClientEventListenerDefinitions,
    ...channelClientEventListenerDefinitions,
    ...emojiClientEventListenerDefinitions,
    ...guildClientEventListenerDefinitions,
    ...memberClientEventListenerDefinitions,
    ...messageClientEventListenerDefinitions,
    ...reactionClientEventListenerDefinitions,
    ...roleClientEventListenerDefinitions,
    ...userClientEventListenerDefinitions,
    ...voiceClientEventListenerDefinitions,
  });
}
