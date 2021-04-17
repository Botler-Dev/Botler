import {TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import SimpleErrorResponseError from '../error/SimpleErrorResponseError';

export default class PermissionDeniedError extends SimpleErrorResponseError {
  /**
   * @param {string} action String inserted into the following: `You are not allowed to [action].` (Default `perform this action`)
   */
  constructor(
    globalSettings: GlobalSettingsWrapper,
    channel: TextBasedChannel,
    action = 'perform this action'
  ) {
    super(globalSettings, channel, `You are not allowed to ${action}`, undefined);
  }
}
