import {Message, MessageEmbed, TextBasedChannel} from 'discord.js';
import {container} from 'tsyringe';
import GlobalSettingsWrapper, {ColorType} from '../../../database/wrappers/GlobalSettingsWrapper';
import CommandError from './CommandError';

export default class ResponseError extends CommandError {
  readonly channel: TextBasedChannel;

  readonly publicMessage: string;

  readonly publicDescription?: string;

  protected readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    channel: TextBasedChannel,
    publicMessage: string,
    publicDescription?: string,
    globalSettings = container.resolve(GlobalSettingsWrapper)
  ) {
    super(
      `Command error with public message response "${publicMessage}" and description "${publicDescription}".`
    );
    this.channel = channel;
    this.publicMessage = publicMessage;
    this.publicDescription = publicDescription;
    this.globalSettings = globalSettings;
  }

  async send(): Promise<Message> {
    const embed = new MessageEmbed().setColor(this.globalSettings.getColor(ColorType.Bad));
    const message = `❌ ${this.publicMessage}`;
    if (this.publicDescription) {
      embed.setTitle(message).setDescription(this.publicDescription);
    } else {
      embed.setDescription(message);
    }
    return this.channel.send(embed);
  }
}
