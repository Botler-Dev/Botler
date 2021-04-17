import {TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import SimpleErrorResponseError from '../error/SimpleErrorResponseError';

export default class MissingParameterError extends SimpleErrorResponseError {
  constructor(globalSettings: GlobalSettingsWrapper, channel: TextBasedChannel, name?: string) {
    super(
      globalSettings,
      channel,
      `Parameter ${name ? `\`${name}\` ` : ''}was either not provided or could not be parsed.`,
      undefined
    );
  }
}
