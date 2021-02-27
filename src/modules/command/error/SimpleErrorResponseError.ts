import {MessageEmbed, TextBasedChannel} from 'discord.js';
import {container} from 'tsyringe';
import GlobalSettingsWrapper, {ColorType} from '../../../database/wrappers/GlobalSettingsWrapper';
import ResponseError from './ResponseError';

export default class SimpleErrorResponseError extends ResponseError {
  readonly publicMessage: string;

  constructor(
    channel: TextBasedChannel,
    publicMessage: string,
    messageOrRealError:
      | Error
      | string
      | undefined = `SimpleErrorResponseError with public message "${publicMessage}".`,
    globalSettings = container.resolve(GlobalSettingsWrapper)
  ) {
    const embed = new MessageEmbed()
      .setColor(globalSettings.getColor(ColorType.Bad))
      .setDescription(`❌ ${publicMessage}`);
    super(channel, undefined, embed, messageOrRealError);
    this.publicMessage = publicMessage;
  }
}
