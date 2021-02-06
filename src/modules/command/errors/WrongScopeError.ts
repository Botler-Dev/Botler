import {DMChannel, TextBasedChannels} from 'discord.js';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import ResponseError from './ResponseError';

export default class WrongScopeError extends ResponseError {
  constructor(channel: TextBasedChannels, globalSettings?: GlobalSettingsWrapper) {
    super(
      channel,
      `Wrong Execution Scope`,
      `This command can only be used in ${channel instanceof DMChannel ? 'servers' : 'DMs'}.`,
      globalSettings
    );
  }
}
