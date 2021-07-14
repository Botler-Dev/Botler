import {Message} from 'discord.js';

/**
 * Error to abort command execution.
 *
 * Only gets logged if {@link CommandError.realError} is set and can send a error message using the {@link CommandError.send}.
 */
export abstract class CommandError extends Error {
  /**
   * Actual error that gets logged to the console.
   */
  readonly realError?: Error;

  /**
   * @param privateMessageOrRealError The error message if it is a string else it is the actual error to log.
   */
  constructor(privateMessageOrRealError: Error | string) {
    super(
      typeof privateMessageOrRealError === 'string'
        ? privateMessageOrRealError
        : `CommandError with real error: ${privateMessageOrRealError.message}`
    );
    if (privateMessageOrRealError instanceof Error) this.realError = privateMessageOrRealError;
  }

  /**
   * Sends a message / some messages to inform the user.
   *
   * Gets called once it reaches the command execution root in the module.
   */
  abstract send(): Promise<void | Message | Message[]>;
}
