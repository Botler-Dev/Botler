import {Message, MessageEmbed, TextBasedChannels} from 'discord.js';
import {container} from 'tsyringe';
import GlobalSettingsWrapper, {ColorType} from '../../../database/wrappers/GlobalSettingsWrapper';
import CommandError from './CommandError';

export default class ResponseError extends CommandError {
  readonly channel: TextBasedChannels;

  readonly title: string;

  readonly message: string;

  protected readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    channel: TextBasedChannels,
    title: string,
    message: string,
    globalSettings = container.resolve(GlobalSettingsWrapper)
  ) {
    super(`Command error with message response: Title: "${title}" Message: "${message}".`);
    this.channel = channel;
    this.title = title;
    this.message = message;
    this.globalSettings = globalSettings;
  }

  async send(): Promise<Message> {
    const embed = new MessageEmbed()
      .setTitle(`❌ ${this.title}`)
      .setDescription(this.message)
      .setColor(this.globalSettings.getColor(ColorType.Bad));
    return this.channel.send(embed);
  }
}
