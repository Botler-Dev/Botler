import {MessageSender} from '../message/MessageSender';
import {DetailedResponseError} from '../error/DetailedResponseError';

/**
 * {@link CommandError} for an unexpectedly encountered error.
 */
export class UnexpectedError extends DetailedResponseError {
  constructor(sender: MessageSender, error: Error) {
    super(
      sender,
      'Something went wrong',
      'An unexpected error occurred while executing the command.\nContact the administrators if this happens again.',
      error
    );
  }
}
