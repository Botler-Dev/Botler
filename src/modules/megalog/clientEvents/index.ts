import {Logger} from '@/logger';
import {Client} from 'discord.js';
import {AuditLogMatcher} from '../auditLog/AuditLogMatcher';
import type {MegalogEventTypeManager} from '../eventType/MegalogEventTypeManager';
import type {MegalogSubscriptionManager} from '../MegalogSubscriptionManager';
import {
  AuditLogSupportedBanClientEvent,
  MegalogSupportedBanClientEvent,
  registerBanClientEventListeners,
} from './ban';
import {
  AuditLogSupportedChannelClientEvent,
  MegalogSupportedChannelClientEvent,
  registerChannelClientEventListeners,
} from './channel';
import {
  AuditLogSupportedEmojiClientEvent,
  MegalogSupportedEmojiClientEvent,
  registerEmojiClientEventListeners,
} from './emoji';
import {
  AuditLogSupportedGuildClientEvent,
  MegalogSupportedGuildClientEvent,
  registerGuildClientEventListeners,
} from './guild';
import {
  AuditLogSupportedMemberClientEvent,
  MegalogSupportedMemberClientEvent,
  registerMemberClientEventListeners,
} from './member';
import {
  AuditLogSupportedMessageClientEvent,
  MegalogSupportedMessageClientEvent,
  registerMessageClientEventListeners,
} from './message';
import {
  AuditLogSupportedReactionClientEvent,
  MegalogSupportedReactionClientEvent,
  registerReactionClientEventListeners,
} from './reaction';
import {
  AuditLogSupportedRoleClientEvent,
  MegalogSupportedRoleClientEvent,
  registerRoleClientEventListeners,
} from './role';
import {
  AuditLogSupportedUserClientEvent,
  MegalogSupportedUserClientEvent,
  registerUserClientEventListeners,
} from './user';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';
import {
  AuditLogSupportedVoiceClientEvent,
  MegalogSupportedVoiceClientEvent,
  registerVoiceClientEventListeners,
} from './voice';

export type MegalogSupportedClientEvent =
  | MegalogSupportedMessageClientEvent
  | MegalogSupportedChannelClientEvent
  | MegalogSupportedEmojiClientEvent
  | MegalogSupportedBanClientEvent
  | MegalogSupportedMemberClientEvent
  | MegalogSupportedGuildClientEvent
  | MegalogSupportedRoleClientEvent
  | MegalogSupportedVoiceClientEvent
  | MegalogSupportedReactionClientEvent
  | MegalogSupportedUserClientEvent;

export type AuditLogSupportedClientEvent =
  | AuditLogSupportedMessageClientEvent
  | AuditLogSupportedChannelClientEvent
  | AuditLogSupportedEmojiClientEvent
  | AuditLogSupportedBanClientEvent
  | AuditLogSupportedMemberClientEvent
  | AuditLogSupportedGuildClientEvent
  | AuditLogSupportedRoleClientEvent
  | AuditLogSupportedVoiceClientEvent
  | AuditLogSupportedReactionClientEvent
  | AuditLogSupportedUserClientEvent;

export function registerClientEventListeners(
  client: Client,
  logger: Logger,
  subscriptionManager: MegalogSubscriptionManager,
  eventTypeManager: MegalogEventTypeManager,
  auditLogMatcher: AuditLogMatcher
): void {
  const utils = new MegalogClientEventUtils(
    client,
    logger,
    subscriptionManager,
    eventTypeManager,
    auditLogMatcher
  );
  registerMessageClientEventListeners(utils);
  registerChannelClientEventListeners(utils);
  registerEmojiClientEventListeners(utils);
  registerBanClientEventListeners(utils);
  registerMemberClientEventListeners(utils);
  registerGuildClientEventListeners(utils);
  registerRoleClientEventListeners(utils);
  registerVoiceClientEventListeners(utils);
  registerReactionClientEventListeners(utils);
  registerUserClientEventListeners(utils);
}
