import {Collection} from 'discord.js';

import OptionsCleaner from '../../utils/optionsCleaner';
import Command, {CommandName} from './Command';

export type CommandCategoryDefinition = {
  name: string;
  description?: string;
  hidden?: boolean;
  commands: Constructor<Command>[];
  subcategories?: CommandCategoryDefinition[];
};

export type CleanedCommandCategoryDefinition = CommandCategoryDefinition & {
  description: string;
  hidden: boolean;
};

export default class CommandCategory {
  readonly name: string;

  readonly description: string;

  readonly hidden: boolean;

  /**
   * All commands in this category level. Only mapped with the `name` property.
   */
  readonly commands: Collection<CommandName, Command>;

  readonly subcategories?: Collection<string, CommandCategory>;

  private static readonly definitionCleaner = new OptionsCleaner<
    CommandCategoryDefinition,
    CleanedCommandCategoryDefinition
  >({
    name: Error,
    description: '',
    hidden: false,
    commands: (commands: Constructor<Command>[]) => {
      if (commands.length === 0) {
        throw new Error('Command categories must have at least have one command in them.');
      }
      return commands;
    },
    subcategories: (raw?: CommandCategoryDefinition[]) => raw,
  });

  constructor(definition: CommandCategoryDefinition) {
    const cleanDefinition = CommandCategory.definitionCleaner.clean(definition);
    this.name = cleanDefinition.name;
    this.description = cleanDefinition.description;
    this.hidden = cleanDefinition.hidden;
    this.commands = new Collection(
      cleanDefinition.commands
        .map(CommandConstructor => new CommandConstructor())
        .map(command => [command.name, command])
    );
    this.subcategories = CommandCategory.createSubcategories(cleanDefinition.subcategories);
  }

  private static createSubcategories(subcategories?: CommandCategoryDefinition[]) {
    if (subcategories === undefined) return undefined;
    const categories = subcategories
      .map(category => new CommandCategory(category))
      .map(category => [category.name, category] as [string, CommandCategory]);
    return new Collection(categories);
  }

  getAllCommands(): Collection<CommandName, Command> {
    if (this.subcategories === undefined) return this.commands.clone();
    return this.commands.concat(...this.subcategories.map(category => category.getAllCommands()));
  }
}
