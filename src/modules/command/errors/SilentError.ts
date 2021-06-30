import {CommandError} from '../error/CommandError';

/**
 * {@link CommandError} that only aborts the command execution.
 */
export class SilentError extends CommandError {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(privateMessage: string) {
    super(privateMessage);
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  async send(): Promise<void> {}
}
