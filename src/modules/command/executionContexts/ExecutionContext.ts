import {ConcreteCommandCacheWrapper, CommandCacheWrapper} from '../cache/CommandCacheWrapper';
import {Command} from '../command/Command';
import {EmptyParseResults, ParseResults} from '../parser/ParserEngine';
import {GuildMemberContext} from './guild/GuildMemberContext';
import {InitialExecutionContext} from './InitialExecutionContext';
import {ReactionExecutionContext} from './ReactionExecutionContext';
import {ResponseExecutionContext} from './ResponseExecutionContext';

/**
 * Command execution context that is passed to the {@link Command}s and
 * which contains all data related to the execution.
 */
export type ExecutionContext<
  TCache extends ConcreteCommandCacheWrapper = CommandCacheWrapper,
  TExistingParseResults extends ParseResults = EmptyParseResults,
  TCommand extends Command<TCache, TExistingParseResults> = Command<TCache, TExistingParseResults>,
  TGuildContext extends GuildMemberContext | undefined = GuildMemberContext | undefined
> =
  | ResponseExecutionContext<TCache, TExistingParseResults, TCommand, TGuildContext>
  | InitialExecutionContext<TCache, TExistingParseResults, TCommand, TGuildContext>
  | ReactionExecutionContext<TCache, TCommand, TGuildContext>;
