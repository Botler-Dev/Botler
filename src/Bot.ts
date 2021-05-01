import {PrismaClient} from '@prisma/client';
import {ChannelManager, Client, GuildManager, UserManager} from 'discord.js';
import {distinctUntilChanged, map, skip} from 'rxjs/operators';
import {container} from 'tsyringe';

import DatabaseCleaner from './database/DatabaseCleaner';
import DatabaseEventHub from './database/DatabaseEventHub';
import GlobalSettingsManager from './database/managers/GlobalSettingsManager';
import GlobalSettingsWrapper from './database/wrappers/GlobalSettingsWrapper';
import Logger, {proxyNativeConsole} from './logger/Logger';
import MasterLogger from './logger/MasterLogger';
import CommandModule from './modules/command/CommandModule';
import ModuleLoader from './modules/ModuleLoader';
import {ExitCode, exitWithMessage} from './utils/process';

export default class Bot {
  private masterLogger!: MasterLogger;

  private globalLogger!: Logger;

  private prisma!: PrismaClient;

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

    this.prisma = await this.createPrismaClient();
    container.registerInstance(PrismaClient, this.prisma);

    this.eventHub = new DatabaseEventHub(this.masterLogger);
    container.register(DatabaseEventHub, {useValue: this.eventHub});
    await this.eventHub.initialize();

    this.globalSettingsManager = new GlobalSettingsManager(
      this.prisma,
      this.masterLogger,
      this.eventHub
    );
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

    this.moduleLoader = new ModuleLoader(container, this.masterLogger, [CommandModule]);
    container.registerInstance(ModuleLoader, this.moduleLoader);
    await this.moduleLoader.initialize();

    await this.login();
  }

  private async login(): Promise<void> {
    await this.client.login(this.globalSettings.discordToken);
    this.globalSettings.afterEntityChangeWithInitial
      .pipe(
        map(entity => entity.discordToken),
        distinctUntilChanged(),
        skip(1)
      )
      .subscribe(() =>
        exitWithMessage(
          ExitCode.DiscordTokenChanged,
          'Discord token changed which requires a restart.'
        )
      );
  }

  private async createPrismaClient(): Promise<PrismaClient> {
    const client = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ??
            `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@` +
              `${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_DATABASE}?${process.env.DATABASE_ARGS}`,
        },
      },
      log: [
        {level: 'query', emit: 'event'},
        {level: 'info', emit: 'event'},
        {level: 'warn', emit: 'event'},
        {level: 'error', emit: 'event'},
      ],
    });

    const logger = this.masterLogger.getScope('prisma');
    client.$on('info', event => {
      if (event.target === 'quaint::connector::metrics') return;
      logger.info(event.message);
    });
    client.$on('warn', event => logger.warn(event.message));
    client.$on('error', event => logger.error(event.message));
    if (process.env.PRISMA_LOG_QUERIES?.toLowerCase() === 'true')
      // eslint-disable-next-line no-console
      client.$on('query', event => console.debug(event));

    await client.$connect();
    return client;
  }
}
