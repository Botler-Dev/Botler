import {Message} from 'discord.js';
import GuildWrapper from '../../../database/wrappers/GuildWrapper';
import type Command from '../Command';
import MessageExecutionContext, {ParsedValues} from './MessageExecutionContext';

export type InitialParsedValues = {
  prefix: string;
  command: Command;
};

export default class InitialExecutionContext<
  TExistingValues extends InitialParsedValues & ParsedValues = InitialParsedValues
> extends MessageExecutionContext<TExistingValues> {
  constructor(message: Message, guild: GuildWrapper | undefined, prefix: string, command: Command) {
    super(message, guild);
    this.addParseResult('prefix', {
      value: prefix,
      length: prefix.length,
    });
    this.addParseResult('command', {
      value: command,
      length: command.name.length,
    });
  }
}
