import {Logger} from '@/logger';
import {Client} from 'discord.js';
import {AuditLogMatcher} from '../auditLog/AuditLogMatcher';
import type {MegalogEventTypeManager} from '../eventType/MegalogEventTypeManager';
import type {MegalogChannelManager} from '../MegalogChannelManager';
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
  AuditLogSupportedMessageClientEvent,
  MegalogSupportedMessageClientEvent,
  registerMessageClientEventListeners,
} from './message';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedClientEvent =
  | MegalogSupportedMessageClientEvent
  | MegalogSupportedChannelClientEvent
  | MegalogSupportedEmojiClientEvent
  | MegalogSupportedBanClientEvent;

export type AuditLogSupportedClientEvent =
  | AuditLogSupportedMessageClientEvent
  | AuditLogSupportedChannelClientEvent
  | AuditLogSupportedEmojiClientEvent
  | AuditLogSupportedBanClientEvent;

export function registerClientEventListeners(
  client: Client,
  logger: Logger,
  channelManager: MegalogChannelManager,
  eventTypeManager: MegalogEventTypeManager,
  auditLogMatcher: AuditLogMatcher
): void {
  const utils = new MegalogClientEventUtils(
    client,
    logger,
    channelManager,
    eventTypeManager,
    auditLogMatcher
  );
  registerMessageClientEventListeners(utils);
  registerChannelClientEventListeners(utils);
  registerEmojiClientEventListeners(utils);
  registerBanClientEventListeners(utils);
}
