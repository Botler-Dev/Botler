import {Message} from 'discord.js';
import GuildWrapper from '../../../database/wrappers/GuildWrapper';
import {ParseResult} from '../parsers/parser';
import UserExecutionContext from './UserExecutionContext';

export type ParsedValues = Record<string, unknown>;

export type ParseResults<TValues extends ParsedValues = ParsedValues> = {
  [name in keyof TValues]: ParseResult<TValues[name]>;
};

export default abstract class MessageExecutionContext extends UserExecutionContext {
  message: Message;

  readonly values: ParsedValues = {};

  readonly parseResults: ParseResults = {};

  private _parseIndex = 0;

  get parseIndex(): number {
    return this._parseIndex;
  }

  constructor(message: Message, guild: GuildWrapper | undefined) {
    super(message.author, guild);
    this.message = message;
  }

  protected addParseResult(name: string, result: ParseResult): void {
    this.values[name] = result.value;
    this.parseResults[name] = result;
    this._parseIndex += result.length;
  }
}
