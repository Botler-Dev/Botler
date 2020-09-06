import { Client } from 'discord.js';
import { container } from 'tsyringe';
import { ConnectionOptions } from 'typeorm';

import OptionsCleaner from './utils/optionsCleaner';
import AbstractModule from './modules/AbstractModule';
import CommandModule from './modules/command/CommandModule';

export interface BotConfig {
  ormconfig: ConnectionOptions;
}

export default class Bot {
  public static readonly MODULES: ReadonlyArray<Constructor<AbstractModule>> = [
    CommandModule,
  ];

  private client!: Client;

  private modules!: AbstractModule[];

  private readonly botConfig: BotConfig;

  private static readonly botConfigCleaner =
    new OptionsCleaner<BotConfig>({
      ormconfig: Error,
    });

  constructor(botConfig: BotConfig) {
    this.botConfig = Bot.botConfigCleaner.clean(botConfig);
  }

  public async initializeBot() {
    this.client = new Client({
      disableMentions: 'everyone', partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
    });
    container.register(Client, { useValue: this.client });

    this.modules = Bot.MODULES
      .map((constructor) => container.resolve(constructor));
    Promise.all(this.modules.map((module) => module.initialize?.()));
    Promise.all(this.modules.map((module) => module.postInitialize?.()));

    // Discord.js client login here
  }
}
