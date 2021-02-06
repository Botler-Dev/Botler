import CommandError from './CommandError';

export default class SilentError extends CommandError {
  constructor() {
    super(`Silent command error.`);
  }
}
