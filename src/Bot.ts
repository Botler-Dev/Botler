import {Client} from 'discord.js';
import {container} from 'tsyringe';
import {ConnectionOptions} from 'typeorm';

import MasterLogger, {MasterLoggerConfig} from './logger/MasterLogger';
import ScopedLogger from './logger/ScopedLogger';
import Module from './modules/Module';
import CommandModule from './modules/command/CommandModule';
import OptionsCleaner from './utils/optionsCleaner';

export interface BotConfig {
  ormconfig: ConnectionOptions;
  logger?: MasterLoggerConfig;
}

export default class Bot {
  public static readonly MODULES: ReadonlyArray<Constructor<Module>> = [CommandModule];

  private masterLogger!: MasterLogger;

  private globalLogger!: ScopedLogger;

  private client!: Client;

  private modules!: Module[];

  private readonly botConfig: BotConfig;

  private static readonly botConfigCleaner = new OptionsCleaner<BotConfig>({
    ormconfig: Error,
    logger: (raw?: MasterLoggerConfig) => raw,
  });

  constructor(botConfig: BotConfig) {
    this.botConfig = Bot.botConfigCleaner.clean(botConfig);
  }

  public async initializeBot(): Promise<void> {
    this.masterLogger = new MasterLogger(this.botConfig.logger);
    container.register(MasterLogger, {useValue: this.masterLogger});

    this.globalLogger = new ScopedLogger('global');
    container.register(ScopedLogger, {useValue: this.globalLogger});

    this.client = new Client({
      disableMentions: 'everyone',
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
    });
    container.register(Client, {useValue: this.client});

    this.modules = Bot.MODULES.map(constructor => container.resolve(constructor));
    Promise.all(this.modules.map(module => module.initialize?.()));
    Promise.all(this.modules.map(module => module.postInitialize?.()));

    // Discord.js client login here
  }
}
