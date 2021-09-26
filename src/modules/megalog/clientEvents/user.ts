import {ClientEventListenerType} from './utils/createClientEventListener';
import {ClientEventListenerDefinitions} from './utils/createClientEventListeners';

export type SupportedUserGuildClientEvent = never;

export type SupportedUserAuditLogClientEvent = never;

export type SupportedUserGlobalClientEvent = 'userUpdate';

export const userClientEventListenerDefinitions: ClientEventListenerDefinitions<
  SupportedUserGuildClientEvent,
  SupportedUserAuditLogClientEvent,
  SupportedUserGlobalClientEvent
> = {
  userUpdate: {
    type: ClientEventListenerType.Global,
    relevanceFilter: async (guild, user) => !!(await guild.members.fetch(user.id).catch(() => {})),
  },
};
