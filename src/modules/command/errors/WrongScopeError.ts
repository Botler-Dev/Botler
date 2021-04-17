import {DMChannel, TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import SimpleErrorResponseError from '../error/SimpleErrorResponseError';

export default class WrongScopeError extends SimpleErrorResponseError {
  constructor(globalSettings: GlobalSettingsWrapper, channel: TextBasedChannel) {
    super(
      globalSettings,
      channel,
      `This command can only be used in ${channel instanceof DMChannel ? 'servers' : 'DMs'}.`,
      undefined
    );
  }
}
