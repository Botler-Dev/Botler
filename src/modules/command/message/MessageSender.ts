import {Client, EmojiResolvable, MessageReaction} from 'discord.js';
import {Message, MessageEmbed, TextBasedChannel} from 'discord.js';
import {GlobalSettingsWrapper} from '@/settings';
import {optional, unchecked} from '@/utils/optionCleaners';
import {OptionsCleanerDefinition, cleanOptions} from '@/utils/optionsCleaner';
import {resolveAnyEmoji} from '@/utils/resolve';
import {DetailedResponseError} from '../error/DetailedResponseError';
import {SimpleResponseError} from '../error/SimpleResponseError';
import {MessageType, messageEmojis, messageToColorType} from './MessageType';

export interface MessageOptions {
  /**
   * Type of message which changes the appearance of the generated message. (default {@link MessageType.Neutral})
   */
  type?: MessageType;
  /**
   * Reactions that should be automatically added to the created message with
   * the descriptions being automatically added to the message.
   * (default none)
   */
  reactionOptions?: ReactionOption[];
}

interface CleanMessageOptions extends MessageOptions {
  type: MessageType;
}

const messageOptionsDefinition: OptionsCleanerDefinition<MessageOptions, CleanMessageOptions> = {
  type: optional(MessageType.Neutral),
  reactionOptions: unchecked(),
};

export interface ReactionOption {
  emoji: EmojiResolvable | string;
  description: string;
}

/**
 * Sender for command of a specific channel to send responses in a standardized format.
 */
export class MessageSender {
  readonly channel: TextBasedChannel;

  private readonly globalSettings: GlobalSettingsWrapper;

  private readonly client: Client;

  constructor(globalSettings: GlobalSettingsWrapper, client: Client, channel: TextBasedChannel) {
    this.globalSettings = globalSettings;
    this.client = client;
    this.channel = channel;
  }

  /**
   * Send a custom message.
   */
  sendRaw = ((...args: Parameters<TextBasedChannel['send']>) =>
    this.channel.send(...args)) as TextBasedChannel['send'];

  /**
   * Send a simple message.
   */
  async send(content: string, options?: MessageOptions): Promise<Message> {
    const cleaned = cleanOptions(messageOptionsDefinition, options ?? {});
    let description = `${messageEmojis[cleaned.type]} ${content}`;
    if (cleaned.reactionOptions)
      description += `\n\n${this.reactionOptionsToString(cleaned.reactionOptions)}`;
    const message = await this.sendRaw({
      embed: {
        color: this.getColor(cleaned.type),
        description,
      },
    });
    if (cleaned.reactionOptions) await MessageSender.reactOptions(message, cleaned.reactionOptions);
    return message;
  }

  private static reactOptions(
    message: Message,
    options: ReactionOption[]
  ): Promise<MessageReaction[]> {
    return Promise.all(options.map(({emoji}) => message.react(emoji)));
  }

  /**
   * Send a detailed message.
   */
  async sendDetailed(
    title: string,
    description: string,
    options?: MessageOptions
  ): Promise<Message> {
    const cleaned = cleanOptions(messageOptionsDefinition, options ?? {});

    const embed = new MessageEmbed({
      color: this.getColor(cleaned.type),
      title,
      description,
    });
    if (cleaned.reactionOptions)
      embed.addField('Reaction Options', this.reactionOptionsToString(cleaned.reactionOptions));
    const message = await this.sendRaw(embed);
    if (cleaned.reactionOptions) MessageSender.reactOptions(message, cleaned.reactionOptions);
    return message;
  }

  private getColor(type: MessageType): number {
    return this.globalSettings.getColor(messageToColorType[type]);
  }

  private reactionOptionsToString(options: ReactionOption[]): string {
    return options
      .map(
        ({emoji, description}) => `${resolveAnyEmoji(this.client.emojis, emoji)}: ${description}`
      )
      .join('\n');
  }

  /**
   * Throw an error and send a simple error message.
   *
   * @param privateMessageOrRealError The error message if it is a string else it is the actual error to log.
   */
  throwError(publicMessage: string, privateMessageOrRealError?: Error | string): never {
    throw new SimpleResponseError(this, publicMessage, privateMessageOrRealError);
  }

  /**
   * Throw an error and send a detailed error message.
   *
   * @param privateMessageOrRealError The error message if it is a string else it is the actual error to log.
   */
  throwDetailedError(
    publicTitle: string,
    publicDescription: string,
    privateMessageOrRealError?: Error | string
  ): never {
    throw new DetailedResponseError(
      this,
      publicTitle,
      publicDescription,
      privateMessageOrRealError
    );
  }
}
