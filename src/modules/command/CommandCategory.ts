import {Collection, ReadonlyCollection} from 'discord.js';
import {DependencyContainer} from 'tsyringe';
import ScopedLogger from '../../logger/ScopedLogger';
import type Command from './Command';
import type {CommandName} from './Command';
import CommandManager from './CommandManager';

export type CommandCategoryGenerator = (container: DependencyContainer) => CommandCategory;

export type CommandCategoryName = string;

export default class CommandCategory {
  readonly parent?: CommandCategory;

  readonly name: CommandCategoryName;

  readonly description?: string;

  readonly path: string;

  private readonly _commands = new Collection<CommandName, Command>();

  get commands(): ReadonlyCollection<CommandName, Command> {
    return this._commands;
  }

  private readonly _subcategories = new Collection<CommandCategoryName, CommandCategory>();

  get subcategories(): ReadonlyCollection<CommandCategoryName, CommandCategory> {
    return this._subcategories;
  }

  private readonly container: DependencyContainer;

  private readonly logger: ScopedLogger;

  private readonly commandManager: CommandManager;

  constructor(
    container: DependencyContainer,
    parent: CommandCategory | undefined,
    name: CommandCategoryName,
    description?: string
  ) {
    this.parent = parent;
    this.name = name;
    this.description = description;
    this.path = `${parent?.path ?? ''}${name}/`;
    this.container = container;
    this.logger = container.resolve(ScopedLogger);
    this.commandManager = container.resolve(CommandManager);
  }

  createSubcategory(name: CommandCategoryName, description?: string): CommandCategory {
    let category = this.subcategories.get(name);
    if (category) return category;
    category = new CommandCategory(this.container, this, name, description);
    this._subcategories.set(name, category);
    this.logger.info(`Created new command category "${category.path}".`);
    return category;
  }

  getCategoryAtPath(path: string): CommandCategory | undefined {
    return (
      path
        .split('/')
        // eslint-disable-next-line unicorn/no-reduce
        .reduce<CommandCategory | undefined>(
          (previousCategory, name) => previousCategory?.subcategories.get(name),
          this
        )
    );
  }

  registerCommand(command: Command): void {
    if (command.category !== this)
      throw new Error(
        `Tried to register a command with a non-matching "category" property in command category.`
      );
    this.commandManager.register(command);
    this._commands.set(command.name, command);
  }
}
