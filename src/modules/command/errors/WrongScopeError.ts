import {DMChannel} from 'discord.js';
import SimpleResponseError from '../error/SimpleResponseError';
import MessageSender from '../message/MessageSender';

export default class WrongScopeError extends SimpleResponseError {
  constructor(sender: MessageSender) {
    super(
      sender,
      `This command can only be used in ${sender.channel instanceof DMChannel ? 'servers' : 'DMs'}.`
    );
  }
}
