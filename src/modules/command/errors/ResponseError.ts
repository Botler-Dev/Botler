import {Message, MessageEmbed, TextBasedChannels} from 'discord.js';
import {container} from 'tsyringe';
import GlobalSettingsWrapper, {ColorType} from '../../../database/wrappers/GlobalSettingsWrapper';
import CommandError from './CommandError';

export default class ResponseError extends CommandError {
  readonly channel: TextBasedChannels;

  readonly publicMessage: string;

  readonly publicDescription?: string;

  protected readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    channel: TextBasedChannels,
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
    const embed = new MessageEmbed()
      .setTitle(`❌ ${this.publicMessage}`)
      .setColor(this.globalSettings.getColor(ColorType.Bad));
    if (this.publicDescription) embed.setDescription(this.publicDescription);
    return this.channel.send(embed);
  }
}
