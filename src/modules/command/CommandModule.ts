import {Client, Collection} from 'discord.js';
import {DependencyContainer} from 'tsyringe';
import StaticImplements from '../../utils/staticImplements';

import Module from '../Module';
import {ModuleConstructor} from '../ModuleConstructor';
import Command, {CommandName} from './Command';
import CommandCategory from './CommandCategory';
import categoryDefinition from './root/categoryDefinition';

@StaticImplements<ModuleConstructor>()
export default class CommandModule extends Module {
  static readonly moduleName = 'command';

  static readonly requiredDependencies = [];

  static readonly optionalDependencies = [];

  tree!: CommandCategory;

  /**
   * All commands mapped with only their `name` properties.
   */
  commandInstances!: Collection<CommandName, Command>;

  /**
   * All command names and aliases mapped to the commands
   */
  commandAliases!: Collection<string, Command>;

  readonly client: Client;

  constructor(moduleContainer: DependencyContainer, client = moduleContainer.resolve(Client)) {
    super(moduleContainer);
    this.client = client;
  }

  async initialize(): Promise<void> {
    this.tree = new CommandCategory(categoryDefinition);
    this.commandInstances = this.tree.getAllCommands();
    this.commandAliases = this.commandInstances.flatMap(
      command =>
        new Collection([command.name].concat(command.aliases ?? []).map(name => [name, command]))
    );
  }
}
