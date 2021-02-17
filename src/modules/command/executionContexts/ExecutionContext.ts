import CommandCacheWrapper, {
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import Command from '../command/Command';
import InitialExecutionContext from './InitialExecutionContext';
import {ParsedValues} from './MessageExecutionContext';
import ReactionExecutionContext from './ReactionExecutionContext';
import ResponseExecutionContext from './ResponseExecutionContext';

type ExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TParsedValues extends ParsedValues = Record<string, never>,
  TCommand extends Command<TCache, ParsedValues> = Command<TCache, TParsedValues>
> =
  | ResponseExecutionContext<TCache, TParsedValues, TCommand>
  | InitialExecutionContext<TCache, TParsedValues, TCommand>
  | ReactionExecutionContext<TCache, TCommand>;
export default ExecutionContext;
