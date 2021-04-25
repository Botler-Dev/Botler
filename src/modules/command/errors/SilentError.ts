import CommandError from '../error/CommandError';

export default class SilentError extends CommandError {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(privateMessage: string) {
    super(privateMessage);
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  async send(): Promise<void> {}
}
