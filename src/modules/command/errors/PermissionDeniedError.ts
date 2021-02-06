import {TextBasedChannels} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import ResponseError from './ResponseError';

export default class PermissionDeniedError extends ResponseError {
  /**
   * @param {string} action String inserted into the following: `You are not allowed to [action].` (Default `perform this action`)
   */
  constructor(
    channel: TextBasedChannels,
    action = 'perform this action',
    globalSettings?: GlobalSettingsWrapper
  ) {
    super(channel, `You are not allowed to ${action}`, undefined, globalSettings);
  }
}
