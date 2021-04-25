import GlobalSettingsWrapper from '@/database/wrappers/GlobalSettingsWrapper';
import type CommandCacheManager from '../cache/CommandCacheManager';
import type ReactionListenerManager from '../cache/listeners/ReactionListenerManager';
import type ResponseListenerManager from '../cache/listeners/ResponseListenerManager';
import type {
  CacheFromCommandCacheWrapper,
  ConcreteCommandCacheWrapper,
} from '../cache/CommandCacheWrapper';
import type {GenericCommandCommandCache} from '../cache/CommandCacheWrapper';
import type CommandCategory from '../CommandCategory';
import WrongScopeError from '../errors/WrongScopeError';
import type ExecutionContext from '../executionContexts/ExecutionContext';
import InitialExecutionContext from '../executionContexts/InitialExecutionContext';
import UserExecutionContext from '../executionContexts/UserExecutionContext';
import {EmptyParseResults, ParseResults} from '../parser/ParserEngine';
import SilentError from '../errors/SilentError';

export type CommandName = string;

export default abstract class Command<
  TCache extends ConcreteCommandCacheWrapper = ConcreteCommandCacheWrapper,
  TAlreadyParsedResults extends ParseResults = EmptyParseResults
> {
  abstract readonly name: CommandName;

  readonly aliases?: CommandName[];

  private _category?: CommandCategory;

  get category(): CommandCategory | undefined {
    return this._category;
  }

  abstract readonly isDmCapable: boolean;

  abstract readonly isGuildCapable: boolean;

  abstract readonly isBotMasterOnly: boolean;

  protected readonly globalSettings: GlobalSettingsWrapper;

  constructor(globalSettings: GlobalSettingsWrapper) {
    this.globalSettings = globalSettings;
  }

  registerCategory(category: CommandCategory): void | never {
    if (this.category)
      throw new Error(`Command is already registered in category "${category.path}".`);
    this._category = category;
  }

  async wrapCacheEntity?(
    manager: CommandCacheManager,
    entity: GenericCommandCommandCache<CacheFromCommandCacheWrapper<TCache>>,
    responseListenerManager: ResponseListenerManager,
    reactionListenerManager: ReactionListenerManager
  ): Promise<TCache>;

  protected async checkContextValidity(
    context: ExecutionContext<TCache, TAlreadyParsedResults, this>
  ): Promise<void> {
    if (
      context instanceof UserExecutionContext &&
      this.isBotMasterOnly &&
      !this.globalSettings.isBotMaster(context.user)
    )
      throw new SilentError(
        'Silent permission denied error. Execution requestor is not bot master.'
      );
    if (
      context instanceof InitialExecutionContext &&
      ((context.guild && !this.isGuildCapable) || (!context.guild && !this.isDmCapable))
    )
      throw new WrongScopeError(context.sender);
  }

  abstract execute(context: ExecutionContext<TCache, TAlreadyParsedResults, this>): Promise<void>;
}
