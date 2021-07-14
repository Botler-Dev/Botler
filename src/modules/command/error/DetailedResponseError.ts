import {Message} from 'discord.js';
import type {MessageSender} from '../message/MessageSender';
import {MessageType} from '../message/MessageType';
import {CommandError} from './CommandError';

/**
 * {@link CommandError} with a detailed error message.
 */
export class DetailedResponseError extends CommandError {
  readonly publicTitle: string;

  readonly publicDescription: string;

  private readonly sender: MessageSender;

  /**
   * @param privateMessageOrRealError The error message if it is a string else it is the actual error to log.
   */
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
