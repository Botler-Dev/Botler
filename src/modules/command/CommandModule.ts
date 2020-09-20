import {Client, Collection} from 'discord.js';
import {singleton} from 'tsyringe';

import Module from '../Module';
import Command, {CommandName} from './Command';
import CommandCategory from './CommandCategory';
import categoryDefinition from './root/categoryDefinition';

@singleton()
export default class CommandModule extends Module {
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

  constructor(client: Client) {
    super('Command');
    this.client = client;
  }

  async initialize() {
    this.tree = new CommandCategory(categoryDefinition);
    this.commandInstances = this.tree.getAllCommands();
    this.commandAliases = this.commandInstances.flatMap(
      command =>
        new Collection([command.name].concat(command.aliases ?? []).map(name => [name, command]))
    );
  }
}
