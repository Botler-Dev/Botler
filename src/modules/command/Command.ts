import {DependencyContainer} from 'tsyringe';
import type CommandCategory from './CommandCategory';

export type CommandName = string;

export default abstract class Command {
  abstract readonly name: CommandName;

  readonly aliases?: CommandName[];

  readonly category: CommandCategory;

  abstract readonly dm: boolean;

  abstract readonly botMasterOnly: boolean;

  readonly localCooldown?: number;

  readonly globalCooldown?: number;

  protected readonly container: DependencyContainer;

  constructor(category: CommandCategory, container: DependencyContainer) {
    this.category = category;
    this.container = container;
  }
}
