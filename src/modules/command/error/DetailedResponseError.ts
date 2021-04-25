import {Message} from 'discord.js';
import type MessageSender from '../message/MessageSender';
import MessageType from '../message/MessageType';

import CommandError from './CommandError';

export default class DetailedResponseError extends CommandError {
  readonly publicTitle: string;

  readonly publicDescription: string;

  private readonly sender: MessageSender;

  constructor(
    sender: MessageSender,
    publicTitle: string,
    publicDescription: string,
    privateMessageOrRealError?: Error | string
  ) {
    super(
      privateMessageOrRealError ??
        `DetailedResponseError with public title "${publicTitle}" and description "${publicDescription}".`
    );
    this.sender = sender;
    this.publicTitle = publicTitle;
    this.publicDescription = publicDescription;
  }

  send(): Promise<Message> {
    return this.sender.sendDetailed(this.publicTitle, this.publicDescription, {
      type: MessageType.Error,
    });
  }
}
