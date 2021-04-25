import {Message} from 'discord.js';

export default abstract class CommandError extends Error {
  readonly realError?: Error;

  constructor(privateMessageOrRealError: Error | string) {
    super(
      typeof privateMessageOrRealError === 'string'
        ? privateMessageOrRealError
        : `CommandError with real error: ${privateMessageOrRealError.message}`
    );
    if (privateMessageOrRealError instanceof Error) this.realError = privateMessageOrRealError;
  }

  abstract send(): Promise<void | Message | Message[]>;
}
