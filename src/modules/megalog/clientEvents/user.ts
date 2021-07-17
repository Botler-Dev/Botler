import {ExportProxyClientEvents} from 'discord.js';
import {MegalogClientEventUtils} from './utils/MegalogClientEventUtils';

export type MegalogSupportedUserClientEvent = Extract<keyof ExportProxyClientEvents, 'userUpdate'>;

export type AuditLogSupportedUserClientEvent = Extract<MegalogSupportedUserClientEvent, never>;

export function registerUserClientEventListeners(utils: MegalogClientEventUtils): void {
  utils.listenToGlobalEvent(
    'userUpdate',
    async (guild, user) => !!(await guild.members.fetch(user.id).catch(() => {}))
  );
}
