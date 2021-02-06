import {DependencyContainer} from 'tsyringe';
import GlobalSettingsWrapper from '../../../database/wrappers/GlobalSettingsWrapper';
import type CommandCategory from '../CommandCategory';
import SilentError from '../errors/SilentError';
import WrongScopeError from '../errors/WrongScopeError';
import ExecutionContext from '../executionContexts/ExecutionContext';
import InitialExecutionContext from '../executionContexts/InitialExecutionContext';
import UserExecutionContext from '../executionContexts/UserExecutionContext';

export type CommandName = string;

export default abstract class Command {
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

  protected async checkContextValidity(context: ExecutionContext): Promise<void> {
    if (
      context instanceof UserExecutionContext &&
      this.isBotMasterOnly &&
      !this.globalSettings.isBotMaster(context.user)
    )
      throw new SilentError();
    if (
      context instanceof InitialExecutionContext &&
      ((context.guild && !this.isGuildCapable) || (!context.guild && !this.isDmCapable))
    )
      throw new WrongScopeError(context.message.channel, this.globalSettings);
  }

  abstract execute(context: ExecutionContext): Promise<void>;
}
