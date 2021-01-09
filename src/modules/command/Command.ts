import {DependencyContainer} from 'tsyringe';
import type CommandCategory from './CommandCategory';
import ExecutionContext from './executionContexts/ExecutionContext';

export type CommandName = string;

export default abstract class Command {
  abstract readonly name: CommandName;

  readonly aliases?: CommandName[];

  readonly category: CommandCategory;

  // TODO: add capability to define DM only, Guild only, or both
  abstract readonly dm: boolean;

  abstract readonly botMasterOnly: boolean;

  readonly localCooldown?: number;

  readonly globalCooldown?: number;

  protected readonly container: DependencyContainer;

  constructor(category: CommandCategory, container: DependencyContainer) {
    this.category = category;
    this.container = container;
  }

  abstract execute(context: ExecutionContext): Promise<void>;
}
