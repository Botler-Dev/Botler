import {Client, Message} from 'discord.js';
import {DependencyContainer} from 'tsyringe';
import GuildManager from '../../database/managers/GuildManager';
import UserManager from '../../database/managers/UserManager';
import GlobalSettingsWrapper from '../../database/wrappers/GlobalSettingsWrapper';

import StaticImplements from '../../utils/StaticImplements';
import Module from '../Module';
import {ModuleConstructor} from '../ModuleConstructor';
import CommandCategory from './CommandCategory';
import CommandManager from './CommandManager';
import InitialExecutionContext from './executionContexts/InitialExecutionContext';

@StaticImplements<ModuleConstructor>()
export default class CommandModule extends Module {
  static readonly moduleName = 'command';

  static readonly requiredDependencies = [];

  static readonly optionalDependencies = [];

  readonly commands: CommandManager;

  readonly rootCategory: CommandCategory;

  private readonly client: Client;

  private readonly userManager: UserManager;

  private readonly guildManager: GuildManager;

  private readonly globalSettings: GlobalSettingsWrapper;

  constructor(
    moduleContainer: DependencyContainer,
    client = moduleContainer.resolve(Client),
    userManager = moduleContainer.resolve(UserManager),
    guildManager = moduleContainer.resolve(GuildManager),
    globalSettings = moduleContainer.resolve(GlobalSettingsWrapper)
  ) {
    super(moduleContainer);
    this.commands = new CommandManager(this.container);
    this.container.registerInstance(CommandManager, this.commands);
    this.rootCategory = new CommandCategory(moduleContainer, undefined, '');
    this.client = client;
    this.userManager = userManager;
    this.guildManager = guildManager;
    this.globalSettings = globalSettings;
  }

  async postInitialize(): Promise<void> {
    this.client.on('message', async (message: Message) => {
      const guild = message.guild ? await this.guildManager.fetch(message.guild) : undefined;
      const prefix = guild?.prefix ?? this.globalSettings.prefix;
      if (message.author.bot || !message.content.startsWith(prefix)) return;

      const user = await this.userManager.fetch(message.author);

      const commandName = message.content.slice(prefix.length).split(' ', 1)[0].toLowerCase();
      const command = this.commands.lookup.get(commandName);
      if (!command) return;

      const context = new InitialExecutionContext(message, user, guild, prefix, command);
      try {
        await command.execute(context);
      } catch (error) {
        this.logger.error(`Uncaught error while executing command "${command.name}".`, error);
        // TODO: add proper error message
        await message.channel.send('Something went wrong');
      }
    });
  }
}
