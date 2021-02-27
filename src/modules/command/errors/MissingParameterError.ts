import {TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import SimpleErrorResponseError from '../error/SimpleErrorResponseError';

export default class MissingParameterError extends SimpleErrorResponseError {
  constructor(channel: TextBasedChannel, name?: string, globalSettings?: GlobalSettingsWrapper) {
    super(
      channel,
      `Parameter ${name ? `\`${name}\` ` : ''}was either not provided or could not be parsed.`,
      undefined,
      globalSettings
    );
  }
}
