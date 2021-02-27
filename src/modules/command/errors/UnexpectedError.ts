import {TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import DetailedErrorResponseError from '../error/DetailedErrorReponseError';

export default class UnexpectedError extends DetailedErrorResponseError {
  constructor(channel: TextBasedChannel, error: Error, globalSettings?: GlobalSettingsWrapper) {
    super(
      channel,
      'Something went wrong',
      'An unexpected error occurred while executing the command.\nContact the administrators if this happens again.',
      error,
      globalSettings
    );
  }
}
