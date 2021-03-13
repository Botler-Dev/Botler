import {DependencyContainer} from 'tsyringe';
import CommandCacheEntity from '../../../database/entities/command/CommandCacheEntity';
import type CommandCacheManager from '../../../database/managers/command/CommandCacheManager';
import ReactionListenerManager from '../../../database/managers/command/ReactionListenerManager';
import ResponseListenerManager from '../../../database/managers/command/ResponseListenerManager';
import {
  CacheFromCommandCacheWrapper,
  ConcreteCommandCacheWrapper,
} from '../../../database/wrappers/command/CommandCacheWrapper';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import type CommandCategory from '../CommandCategory';
import CommandError from '../error/CommandError';
import WrongScopeError from '../errors/WrongScopeError';
import type ExecutionContext from '../executionContexts/ExecutionContext';
import InitialExecutionContext from '../executionContexts/InitialExecutionContext';
import UserExecutionContext from '../executionContexts/UserExecutionContext';
import {EmptyParseResults, ParseResults} from '../parser/ParserEngine';

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

  protected readonly container: DependencyContainer;

  protected readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    container: DependencyContainer,
    globalSettings = container.resolve(GlobalSettingsWrapper)
  ) {
    this.container = container;
    this.globalSettings = globalSettings;
  }

  registerCategory(category: CommandCategory): void | never {
    if (this.category)
      throw new Error(`Command is already registered in category "${category.path}".`);
    this._category = category;
  }

  async wrapCacheEntity?(
    manager: CommandCacheManager,
    entity: CommandCacheEntity<CacheFromCommandCacheWrapper<TCache>>,
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
      throw new CommandError(
        'Silent permission denied error. Execution requestor is not bot master.'
      );
    if (
      context instanceof InitialExecutionContext &&
      ((context.guild && !this.isGuildCapable) || (!context.guild && !this.isDmCapable))
    )
      throw new WrongScopeError(context.message.channel, this.globalSettings);
  }

  abstract execute(context: ExecutionContext<TCache, TAlreadyParsedResults, this>): Promise<void>;
}
