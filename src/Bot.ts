import {Client} from 'discord.js';
import {distinctUntilChanged, map, skip} from 'rxjs/operators';
import {container} from 'tsyringe';
import {Connection, createConnection} from 'typeorm';

import DatabaseEventHub from './database/DatabaseEventHub';
import GlobalSettingsManager from './database/managers/GlobalSettingsManager';
import GuildManager from './database/managers/GuildManager';
import GlobalSettingsWrapper from './database/wrappers/GlobalSettingsWrapper';
import MasterLogger from './logger/MasterLogger';
import ScopedLogger, {proxyNativeConsole} from './logger/ScopedLogger';
import CommandModule from './modules/command/CommandModule';
import Module from './modules/Module';
import {ExitCode, exitWithMessage} from './utils/process';

export default class Bot {
  public static readonly MODULES: ReadonlyArray<Constructor<Module>> = [CommandModule];

  private masterLogger!: MasterLogger;

  private globalLogger!: ScopedLogger;

  private connection!: Connection;

  private eventHub!: DatabaseEventHub;

  private globalSettingsManager!: GlobalSettingsManager;

  private globalSettings!: GlobalSettingsWrapper;

  private client!: Client;

  private guildManager!: GuildManager;

  private modules!: Module[];

  public async initializeBot(): Promise<void> {
    this.masterLogger = new MasterLogger();
    container.register(MasterLogger, {useValue: this.masterLogger});

    this.globalLogger = new ScopedLogger('global');
    container.register(ScopedLogger, {useValue: this.globalLogger});
    proxyNativeConsole(this.globalLogger);

    this.connection = await createConnection();
    container.register(Connection, {useValue: this.connection});
    await this.connection.runMigrations({transaction: 'all'});

    this.eventHub = new DatabaseEventHub();
    container.register(DatabaseEventHub, {useValue: this.eventHub});
    await this.eventHub.initialize();

    this.globalSettingsManager = new GlobalSettingsManager();
    await this.globalSettingsManager.initialize();
    this.globalSettings = this.globalSettingsManager.get();
    container.register(GlobalSettingsWrapper, {useValue: this.globalSettings});

    this.client = new Client({
      disableMentions: 'everyone',
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
    });
    container.register(Client, {useValue: this.client});

    this.guildManager = new GuildManager();
    await this.guildManager.initialize();
    container.register(GuildManager, {useValue: this.guildManager});

    this.modules = Bot.MODULES.map(constructor => container.resolve(constructor));
    Promise.all(this.modules.map(module => module.initialize?.()));
    Promise.all(this.modules.map(module => module.postInitialize?.()));

    await this.login();
  }

  private async login(): Promise<void> {
    await this.client.login(this.globalSettings.botToken);
    this.globalSettings.afterEntityChangeWithInitial
      .pipe(
        map(entity => entity.botToken),
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe(() =>
        exitWithMessage(ExitCode.BotTokenChanged, 'Bot token changed which requires a restart.')
      );
  }
}
