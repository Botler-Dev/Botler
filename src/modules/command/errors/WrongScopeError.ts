import {DMChannel} from 'discord.js';
import {SimpleResponseError} from '../error/SimpleResponseError';
import {MessageSender} from '../message/MessageSender';

/**
 * {@link CommandError} for when a command was executed in the wrong scope (DM instead of guild or guild instead of DM).
 *
 * Automatically determines the current scope based on the provided sender's channel.
 */
export class WrongScopeError extends SimpleResponseError {
  constructor(sender: MessageSender) {
    super(
      sender,
      `This command can only be used in ${sender.channel instanceof DMChannel ? 'servers' : 'DMs'}.`
    );
  }
}
