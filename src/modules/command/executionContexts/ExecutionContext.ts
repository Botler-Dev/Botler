import CommandCacheWrapper, {
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import Command from '../command/Command';
import {EmptyParseResults, ParseResults} from '../parser/ParserEngine';
import InitialExecutionContext from './InitialExecutionContext';
import ReactionExecutionContext from './ReactionExecutionContext';
import ResponseExecutionContext from './ResponseExecutionContext';

type ExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TExistingParseResults extends ParseResults = EmptyParseResults,
  TCommand extends Command<TCache, TExistingParseResults> = Command<TCache, TExistingParseResults>
> =
  | ResponseExecutionContext<TCache, TExistingParseResults, TCommand>
  | InitialExecutionContext<TCache, TExistingParseResults, TCommand>
  | ReactionExecutionContext<TCache, TCommand>;
export default ExecutionContext;
