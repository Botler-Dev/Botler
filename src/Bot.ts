import {ChannelManager, Client, GuildEmojiManager, GuildManager, UserManager} from 'discord.js';
import {distinctUntilChanged, map, skip} from 'rxjs/operators';
import {container} from 'tsyringe';
import {Connection, createConnection} from 'typeorm';

import DatabaseEventHub from './database/DatabaseEventHub';
import DatabaseCleaner from './database/DatabaseCleaner';
import GlobalSettingsManager from './database/managers/GlobalSettingsManager';
import GlobalSettingsWrapper from './database/wrappers/GlobalSettingsWrapper';
import MasterLogger from './logger/MasterLogger';
import Logger, {proxyNativeConsole} from './logger/Logger';
import CommandModule from './modules/command/CommandModule';
import ModuleLoader from './modules/ModuleLoader';
import {ExitCode, exitWithMessage} from './utils/process';

export default class Bot {
  private masterLogger!: MasterLogger;

  private globalLogger!: Logger;

  private connection!: Connection;

  private eventHub!: DatabaseEventHub;

  private cleaner!: DatabaseCleaner;

  private globalSettingsManager!: GlobalSettingsManager;

  private globalSettings!: GlobalSettingsWrapper;

  private client!: Client;

  private moduleLoader!: ModuleLoader;

  public async initializeBot(): Promise<void> {
    this.masterLogger = new MasterLogger();
    container.register(MasterLogger, {useValue: this.masterLogger});

    this.globalLogger = this.masterLogger.getScope('global');
    container.register(Logger, {useValue: this.globalLogger});
    proxyNativeConsole(this.globalLogger);

    this.connection = await createConnection();
    container.register(Connection, {useValue: this.connection});
    await this.connection.runMigrations({transaction: 'all'});

    this.eventHub = new DatabaseEventHub(this.masterLogger);
    container.register(DatabaseEventHub, {useValue: this.eventHub});
    await this.eventHub.initialize();

    this.globalSettingsManager = new GlobalSettingsManager(this.connection, this.globalLogger);
    await this.globalSettingsManager.initialize();
    this.globalSettings = this.globalSettingsManager.get();
    container.register(GlobalSettingsWrapper, {useValue: this.globalSettings});

    container.registerSingleton(DatabaseCleaner);
    this.cleaner = container.resolve(DatabaseCleaner);

    this.client = new Client({
      disableMentions: 'everyone',
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION'],
    });
    container.registerInstance(Client, this.client);
    container.registerInstance(UserManager, this.client.users);
    container.registerInstance(GuildManager, this.client.guilds);
    container.registerInstance(ChannelManager, this.client.channels);
    container.registerInstance(GuildEmojiManager, this.client.emojis);

    this.moduleLoader = new ModuleLoader(container, this.masterLogger, [CommandModule]);
    container.registerInstance(ModuleLoader, this.moduleLoader);
    await this.moduleLoader.initialize();

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
