import {DMChannel, TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import ResponseError from './ResponseError';

export default class WrongScopeError extends ResponseError {
  constructor(channel: TextBasedChannel, globalSettings?: GlobalSettingsWrapper) {
    super(
      channel,
      `This command can only be used in ${channel instanceof DMChannel ? 'servers' : 'DMs'}.`,
      undefined,
      globalSettings
    );
  }
}
