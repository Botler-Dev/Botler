import {Client} from 'discord.js';
import {container} from 'tsyringe';
import {Connection, createConnection} from 'typeorm';

import MasterLogger from './logger/MasterLogger';
import ScopedLogger from './logger/ScopedLogger';
import CommandModule from './modules/command/CommandModule';
import Module from './modules/Module';

export default class Bot {
  public static readonly MODULES: ReadonlyArray<Constructor<Module>> = [CommandModule];

  private masterLogger!: MasterLogger;

  private globalLogger!: ScopedLogger;

  private client!: Client;

  private connection!: Connection;

  private modules!: Module[];

  public async initializeBot(): Promise<void> {
    this.masterLogger = new MasterLogger();
    container.register(MasterLogger, {useValue: this.masterLogger});

    this.globalLogger = new ScopedLogger('global');
    container.register(ScopedLogger, {useValue: this.globalLogger});

    this.client = new Client({
      disableMentions: 'everyone',
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
    });
    container.register(Client, {useValue: this.client});

    this.connection = await createConnection();
    container.register(Connection, {useValue: this.connection});
    await this.connection.runMigrations({transaction: 'all'});

    this.modules = Bot.MODULES.map(constructor => container.resolve(constructor));
    Promise.all(this.modules.map(module => module.initialize?.()));
    Promise.all(this.modules.map(module => module.postInitialize?.()));

    // Discord.js client login here
  }
}
