import {CommandGuildSettings, Prisma, PrismaClient} from '@prisma/client';
import {GuildManager, GuildResolvable, Snowflake} from 'discord.js';
import {injectable} from 'tsyringe';
import DatabaseEventHub from '@/database/DatabaseEventHub';
import CacheManager from '@/database/manager/CacheManager';
import CacheSynchronizer from '@/database/synchronizer/CacheSynchronizer';
import GlobalSettingsWrapper from '@/database/wrappers/GlobalSettingsWrapper';
import {resolveIdChecked} from '@/utils/resolve';
import CommandGuildSettingsWrapper from './CommandGuildSettingsWrapper';

@injectable()
export default class CommandGuildSettingsManager extends CacheManager<
  PrismaClient['commandGuildSettings'],
  Snowflake,
  CommandGuildSettingsWrapper
> {
  private readonly synchronizer: CacheSynchronizer<CommandGuildSettings, 'guildId', Snowflake>;

  private readonly globalSettings: GlobalSettingsWrapper;

  private readonly guildManager: GuildManager;

  constructor(
    prisma: PrismaClient,
    globalSettings: GlobalSettingsWrapper,
    guildManager: GuildManager,
    eventHub: DatabaseEventHub
  ) {
    super(prisma.commandGuildSettings);
    this.globalSettings = globalSettings;
    this.guildManager = guildManager;
    this.synchronizer = new CacheSynchronizer(
      eventHub,
      Prisma.ModelName.CommandGuildSettings,
      ({guildId}) => guildId
    );
  }

  async initialize(): Promise<void> {
    await this.synchronizer.initialize();
  }

  async fetch(guild: GuildResolvable): Promise<CommandGuildSettingsWrapper> {
    const id: Snowflake = resolveIdChecked(this.guildManager, guild);

    const cached = this.cache.get(id);
    if (cached) return cached;

    const syncStream = this.synchronizer.getSyncStream(id);
    const entity = await this.model.findUnique({where: {guildId: id}});
    const wrapper = new CommandGuildSettingsWrapper(
      this,
      syncStream,
      entity ?? undefined,
      await this.guildManager.fetch(id),
      this.globalSettings
    );
    wrapper.afterUncache.subscribe(() => this.synchronizer.removeSyncStream(id));
    this.cacheWrapper(id, wrapper);
    return wrapper;
  }
}
