import {CacheManager, CacheSynchronizer, DatabaseEventHub} from '@/database';
import {resolveIdChecked} from '@/utils/resolve';
import {MegalogGuildSettings, Prisma, PrismaClient} from '@prisma/client';
import {GuildManager, GuildResolvable, Snowflake} from 'discord.js';
import {injectable} from 'tsyringe';
import {MegalogSettingsWrapper} from '../settings/MegalogSettingsWrapper';
import {MegalogGuildSettingsWrapper} from './MegalogGuildSettingsWrapper';

@injectable()
export class MegalogGuildSettingsManager extends CacheManager<
  PrismaClient['megalogGuildSettings'],
  Snowflake,
  MegalogGuildSettingsWrapper
> {
  private readonly synchronizer: CacheSynchronizer<MegalogGuildSettings, 'guildId', Snowflake>;

  private readonly megalogSettings: MegalogSettingsWrapper;

  private readonly guildManager: GuildManager;

  constructor(
    prisma: PrismaClient,
    guildManager: GuildManager,
    eventHub: DatabaseEventHub,
    megalogSettings: MegalogSettingsWrapper
  ) {
    super(prisma.megalogGuildSettings);
    this.megalogSettings = megalogSettings;
    this.guildManager = guildManager;
    this.synchronizer = new CacheSynchronizer(
      eventHub,
      Prisma.ModelName.MegalogGuildSettings,
      ({guildId}) => guildId
    );
  }

  async initialize(): Promise<void> {
    await this.synchronizer.initialize();
  }

  async fetch(guild: GuildResolvable): Promise<MegalogGuildSettingsWrapper> {
    const id = resolveIdChecked(this.guildManager, guild);

    const cached = this.cache.get(id);
    if (cached) return cached;

    const syncStream = this.synchronizer.getSyncStream(id);
    const entity = await this.model.findUnique({where: {guildId: id}});
    const wrapper = new MegalogGuildSettingsWrapper(
      this.megalogSettings,
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
