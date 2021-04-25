import {Message} from 'discord.js';
import type MessageSender from '../message/MessageSender';
import MessageType from '../message/MessageType';
import CommandError from './CommandError';

export default class SimpleResponseError extends CommandError {
  readonly publicMessage: string;

  private readonly sender: MessageSender;

  constructor(
    sender: MessageSender,
    publicMessage: string,
    privateMessageOrRealError?: Error | string
  ) {
    super(privateMessageOrRealError ?? `SimpleResponseError with public message: ${publicMessage}`);
    this.sender = sender;
    this.publicMessage = publicMessage;
  }

  send(): Promise<Message> {
    return this.sender.send(this.publicMessage, {type: MessageType.Error});
  }
}
