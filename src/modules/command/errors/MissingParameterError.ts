import {MessageSender} from '../message/MessageSender';
import {SimpleResponseError} from '../error/SimpleResponseError';

/**
 * {@link CommandError} for a missing parameter.
 */
export class MissingParameterError extends SimpleResponseError {
  readonly parameterName?: string;

  /**
   * @param name The parameter name.
   */
  constructor(sender: MessageSender, name?: string) {
    super(
      sender,
      `Parameter ${name ? `\`${name}\` ` : ''}was either not provided or could not be parsed.`
    );
    this.parameterName = name;
  }
}
