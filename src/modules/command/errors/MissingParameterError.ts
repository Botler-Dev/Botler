import {TextBasedChannel} from 'discord.js';
import ResponseError from './ResponseError';

export default class MissingParameterError extends ResponseError {
  constructor(channel: TextBasedChannel, name?: string) {
    super(
      channel,
      `Parameter ${name ? `\`${name}\` ` : ''}was either not provided or could not be parsed.`
    );
  }
}
