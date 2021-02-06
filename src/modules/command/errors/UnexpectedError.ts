import {TextBasedChannels} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import ResponseError from './ResponseError';

export default class UnexpectedError extends ResponseError {
  constructor(channel: TextBasedChannels, globalSettings?: GlobalSettingsWrapper) {
    super(
      channel,
      'Something went wrong',
      'An unexpected error occurred while executing the command.\nContact the administrators if this happens again.',
      globalSettings
    );
  }
}
