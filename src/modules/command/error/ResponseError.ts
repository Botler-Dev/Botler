import {Message, MessageAdditions, TextBasedChannel} from 'discord.js';
import CommandError from './CommandError';

export default class ResponseError extends CommandError {
  readonly channel: TextBasedChannel;

  readonly publicContent?: string;

  readonly publicAdditions?: MessageAdditions;

  constructor(
    channel: TextBasedChannel,
    publicContent?: string,
    publicAdditions?: MessageAdditions,
    messageOrRealError?: Error | string
  ) {
    super(messageOrRealError);
    this.channel = channel;
    this.publicContent = publicContent;
    this.publicAdditions = publicAdditions;
  }

  send(): Promise<Message | Message[]> {
    if (this.publicContent && this.publicAdditions)
      return this.channel.send(this.publicContent, this.publicAdditions);
    if (this.publicContent) return this.channel.send(this.publicContent);
    if (this.publicAdditions) return this.channel.send(this.publicAdditions);
    throw new Error(
      `Both "publicContent" and "publicAdditions" were not specified. Cannot send a message.`
    );
  }
}
