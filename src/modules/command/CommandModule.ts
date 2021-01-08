import {Client} from 'discord.js';
import {DependencyContainer} from 'tsyringe';

import StaticImplements from '../../utils/StaticImplements';
import Module from '../Module';
import {ModuleConstructor} from '../ModuleConstructor';
import CommandCategory from './CommandCategory';
import CommandManager from './CommandManager';

@StaticImplements<ModuleConstructor>()
export default class CommandModule extends Module {
  static readonly moduleName = 'command';

  static readonly requiredDependencies = [];

  static readonly optionalDependencies = [];

  readonly commands: CommandManager;

  readonly rootCategory: CommandCategory;

  private readonly client: Client;

  constructor(moduleContainer: DependencyContainer, client = moduleContainer.resolve(Client)) {
    super(moduleContainer);
    this.commands = new CommandManager(this.container);
    this.container.registerInstance(CommandManager, this.commands);
    this.rootCategory = new CommandCategory(moduleContainer, undefined, '');
    this.client = client;
  }
}
