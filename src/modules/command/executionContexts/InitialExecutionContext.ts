import {Message} from 'discord.js';
import GuildWrapper from '../../../database/wrappers/GuildWrapper';
import type Command from '../Command';
import MessageExecutionContext, {ParsedValues, ParseResults} from './MessageExecutionContext';

export type InitialParsedValues = {
  prefix: string;
  command: Command;
} & ParsedValues;

export default class InitialExecutionContext extends MessageExecutionContext {
  readonly values!: InitialParsedValues;

  readonly parseResults!: ParseResults<InitialParsedValues>;

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
