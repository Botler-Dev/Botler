import {EmojiIdentifierResolvable, MessageReaction} from 'discord.js';
import {GuildEmojiManager} from 'discord.js';
import {Message, MessageEmbed, TextBasedChannel} from 'discord.js';
import GlobalSettingsWrapper from '@/database/wrappers/GlobalSettingsWrapper';
import {optional, unchecked} from '@/utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '@/utils/optionsCleaner';
import DetailedResponseError from '../error/DetailedResponseError';
import SimpleResponseError from '../error/SimpleResponseError';
import MessageType, {messageEmojis, messageToColorType} from './MessageType';

export interface MessageOptions {
  type?: MessageType;
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
  emoji: EmojiIdentifierResolvable;
  description: string;
}

export default class MessageSender {
  readonly channel: TextBasedChannel;

  private readonly globalSettings: GlobalSettingsWrapper;

  private readonly emojiManager: GuildEmojiManager;

  constructor(
    globalSettings: GlobalSettingsWrapper,
    emojiManager: GuildEmojiManager,
    channel: TextBasedChannel
  ) {
    this.globalSettings = globalSettings;
    this.emojiManager = emojiManager;
    this.channel = channel;
  }

  sendRaw = ((...args: Parameters<TextBasedChannel['send']>) =>
    this.channel.send(...args)) as TextBasedChannel['send'];

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
        ({emoji, description}) => `${this.emojiManager.resolveIdentifier(emoji)}: ${description}`
      )
      .join('\n');
  }

  throwError(publicMessage: string, privateMessageOrRealError?: Error | string): never {
    throw new SimpleResponseError(this, publicMessage, privateMessageOrRealError);
  }

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
