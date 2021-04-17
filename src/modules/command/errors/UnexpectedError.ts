import {TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import DetailedErrorResponseError from '../error/DetailedErrorReponseError';

export default class UnexpectedError extends DetailedErrorResponseError {
  constructor(globalSettings: GlobalSettingsWrapper, channel: TextBasedChannel, error: Error) {
    super(
      globalSettings,
      channel,
      'Something went wrong',
      'An unexpected error occurred while executing the command.\nContact the administrators if this happens again.',
      error
    );
  }
}
