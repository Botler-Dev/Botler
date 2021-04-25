import MessageSender from '../message/MessageSender';
import SimpleResponseError from '../error/SimpleResponseError';

export default class PermissionDeniedError extends SimpleResponseError {
  readonly action: string;

  /**
   * @param {string} action String inserted into the following: `You are not allowed to [action].` (Default `perform this action`)
   */
  constructor(sender: MessageSender, action = 'perform this action') {
    super(sender, `You are not allowed to ${action}.`);
    this.action = action;
  }
}
