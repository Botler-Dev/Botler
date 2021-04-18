import CommandCacheWrapper, {ConcreteCommandCacheWrapper} from '../cache/CommandCacheWrapper';
import Command from '../command/Command';
import {EmptyParseResults, ParseResults} from '../parser/ParserEngine';
import GuildMemberContext from './guild/GuildMemberContext';
import InitialExecutionContext from './InitialExecutionContext';
import ReactionExecutionContext from './ReactionExecutionContext';
import ResponseExecutionContext from './ResponseExecutionContext';

type ExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TExistingParseResults extends ParseResults = EmptyParseResults,
  TCommand extends Command<TCache, TExistingParseResults> = Command<TCache, TExistingParseResults>,
  TGuildContext extends GuildMemberContext | undefined = GuildMemberContext | undefined
> =
  | ResponseExecutionContext<TCache, TExistingParseResults, TCommand, TGuildContext>
  | InitialExecutionContext<TCache, TExistingParseResults, TCommand, TGuildContext>
  | ReactionExecutionContext<TCache, TCommand, TGuildContext>;
export default ExecutionContext;
