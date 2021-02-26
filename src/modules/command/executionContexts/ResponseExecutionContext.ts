import CommandCacheWrapper, {
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import Command from '../command/Command';
import MessageExecutionContext, {ParsedValues} from './MessageExecutionContext';

export default class ResponseExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TParsedValues extends ParsedValues = Record<string, never>,
  TCommand extends Command<TCache, ParsedValues> = Command<TCache, TParsedValues>
> extends MessageExecutionContext<TCommand, TCache, TParsedValues> {}
