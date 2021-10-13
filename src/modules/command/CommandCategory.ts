import {Collection} from 'discord.js';
import {DependencyContainer} from 'tsyringe';
import {Logger} from '@/logger';
import {ReadonlyCollection} from '@/utils/ReadonlyCollection';
import type {Command} from './command/Command';
import type {CommandName} from './command/Command';
import {CommandManager} from './CommandManager';

export type CommandCategoryGenerator = (container: DependencyContainer) => CommandCategory;

export type CommandCategoryName = string;

// TODO: figure out a way to categories commands would module needing to know from each other.

/**
 * Branch of the command category tree which holds commands and other categories.
 */
export class CommandCategory {
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

  private readonly logger: Logger;

  private readonly commandManager: CommandManager;

  constructor(
    logger: Logger,
    commandManager: CommandManager,
    parent: CommandCategory | undefined,
    name: CommandCategoryName,
    description?: string
  ) {
    this.parent = parent;
    this.name = name;
    this.description = description;
    this.path = `${parent?.path ?? ''}${name}/`;
    this.logger = logger;
    this.commandManager = commandManager;
  }

  /**
   * Creates a {@link CommandCategory} and registers it in this instance.
   * @returns The created {@link CommandCategory}.
   */
  createSubcategory(name: CommandCategoryName, description?: string): CommandCategory {
    let category = this.subcategories.get(name);
    if (category) return category;
    category = new CommandCategory(this.logger, this.commandManager, this, name, description);
    this._subcategories.set(name, category);
    this.logger.info(`Created new command category "${category.path}".`);
    return category;
  }

  /**
   * Gets the {@link category} at the provided path (category names split by `/`).
   *
   * @returns The CommandCategory if it exists.
   */
  getCategoryAtPath(path: string): CommandCategory | undefined {
    return (
      path
        .split('/')
        // eslint-disable-next-line unicorn/no-array-reduce
        .reduce<CommandCategory | undefined>(
          (previousCategory, name) => previousCategory?.subcategories.get(name),
          this
        )
    );
  }

  /**
   * Registers a command in this category and in the central {@link CommandManager}.
   */
  registerCommand(command: Command): void {
    command.registerCategory(this);
    this.commandManager.register(command);
    this._commands.set(command.name, command);
  }
}
