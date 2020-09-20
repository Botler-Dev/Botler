import { Collection } from 'discord.js';

import OptionsCleaner from '../../utils/optionsCleaner';
import Command from './Command';
import CommandCollection from './CommandCollection';

export type CommandCategoryDefinition = {
  name: string,
  description?: string,
  hidden?: boolean,
  commands: Constructor<Command>[],
  subcategories?: CommandCategoryDefinition[]
};

export type CleanedCommandCategoryDefinition = CommandCategoryDefinition & {
  description: string,
  hidden: boolean,
};

export default class CommandCategory {
  readonly name: string;

  readonly description: string;

  readonly hidden: boolean;

  readonly commands: CommandCollection;

  readonly subcategories?: Collection<string, CommandCategory>;

  private static readonly definitionCleaner =
    new OptionsCleaner<CommandCategoryDefinition, CleanedCommandCategoryDefinition>({
      name: Error,
      description: '',
      hidden: false,
      commands: (commands: Constructor<Command>[]) => {
        if (commands == null || commands.length === 0) {
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
    this.commands = new CommandCollection(cleanDefinition.commands.map((CommandConstructor) => new CommandConstructor()));
    this.subcategories = CommandCategory.createSubcategories(cleanDefinition.subcategories);
  }

  private static createSubcategories(subcategories?: CommandCategoryDefinition[]) {
    if (subcategories == null) return undefined;
    const categories = subcategories
      .map((category) => new CommandCategory(category))
      .map((category) => [category.name, category] as [string, CommandCategory]);
    return new Collection(categories);
  }

  getAllCommands(): CommandCollection {
    if (this.subcategories == null) return this.commands.clone();
    return this.commands.concat(...this.subcategories.map((category) => category.getAllCommands()));
  }
}
