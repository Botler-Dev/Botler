import MessageSender from '../message/MessageSender';
import SimpleResponseError from '../error/SimpleResponseError';

export default class MissingParameterError extends SimpleResponseError {
  readonly parameterName?: string;

  constructor(sender: MessageSender, name?: string) {
    super(
      sender,
      `Parameter ${name ? `\`${name}\` ` : ''}was either not provided or could not be parsed.`
    );
    this.parameterName = name;
  }
}
