import {CommandGuildSettings, Prisma, PrismaClient} from '@prisma/client';
import {GuildManager, GuildResolvable, Snowflake} from 'discord.js';
import {injectable} from 'tsyringe';
import {DatabaseEventHub, CacheManager, CacheSynchronizer} from '@/database';
import {resolveIdChecked} from '@/utils/resolve';
import {CommandGuildSettingsWrapper} from './CommandGuildSettingsWrapper';
import {CommandSettingsWrapper} from '../settings/CommandSettingsWrapper';

@injectable()
export class CommandGuildSettingsManager extends CacheManager<
  PrismaClient['commandGuildSettings'],
  Snowflake,
  CommandGuildSettingsWrapper
> {
  private readonly synchronizer: CacheSynchronizer<CommandGuildSettings, 'guildId', Snowflake>;

  private readonly commandSettings: CommandSettingsWrapper;

  private readonly guildManager: GuildManager;

  constructor(
    prisma: PrismaClient,
    guildManager: GuildManager,
    eventHub: DatabaseEventHub,
    commandSettings: CommandSettingsWrapper
  ) {
    super(prisma.commandGuildSettings);
    this.commandSettings = commandSettings;
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
      this.commandSettings,
      this,
      syncStream,
      entity ?? undefined,
      await this.guildManager.fetch(id)
    );
    wrapper.afterDecache.subscribe(() => this.synchronizer.removeSyncStream(id));
    this.cacheWrapper(id, wrapper);
    return wrapper;
  }
}
