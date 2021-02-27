import {Message} from 'discord.js';

export default class CommandError extends Error {
  readonly realError?: Error;

  constructor(messageOrError?: Error | string) {
    super(messageOrError instanceof Error ? messageOrError.message : messageOrError);
    if (messageOrError instanceof Error) this.realError = messageOrError;
  }

  send?(): Promise<Message | Message[]>;
}
