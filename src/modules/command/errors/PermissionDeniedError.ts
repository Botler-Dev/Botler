import {TextBasedChannels} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import ResponseError from './ResponseError';

export default class PermissionDeniedError extends ResponseError {
  /**
   * @param {string} action String inserted after `You are not allowed to `. No space prefix needed.
   */
  constructor(
    channel: TextBasedChannels,
    action = 'perform this action',
    globalSettings?: GlobalSettingsWrapper
  ) {
    super(channel, `Permission Denied`, `You are not allowed to ${action}.`, globalSettings);
  }
}
