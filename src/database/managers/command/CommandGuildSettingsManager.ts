import {GuildManager, GuildResolvable, Snowflake} from 'discord.js';
import {injectable} from 'tsyringe';
import {Connection} from 'typeorm';
import {resolveIdChecked} from '../../../utils/resolve';
import CommandGuildSettingsEntity from '../../entities/command/CommandGuildSettingsEntity';
import CacheManager from '../../manager/CacheManager';
import CacheSynchronizer from '../../synchronizer/CacheSynchronizer';
import CommandGuildSettingsWrapper from '../../wrappers/command/CommandGuildSettingsWrapper';
import GlobalSettingsWrapper from '../../wrappers/GlobalSettingsWrapper';

@injectable()
export default class CommandGuildSettingsManager extends CacheManager<
  CommandGuildSettingsEntity,
  Snowflake,
  CommandGuildSettingsWrapper
> {
  private readonly synchronizer: CacheSynchronizer<CommandGuildSettingsEntity, 'guild', Snowflake>;

  private readonly globalSettings: GlobalSettingsWrapper;

  private readonly guildManager: GuildManager;

  constructor(
    connection: Connection,
    globalSettings: GlobalSettingsWrapper,
    guildManager: GuildManager
  ) {
    super(CommandGuildSettingsEntity, connection);
    this.globalSettings = globalSettings;
    this.guildManager = guildManager;
    this.synchronizer = new CacheSynchronizer(this.repo.metadata.tableName, ({guild}) => guild);
  }

  async initialize(): Promise<void> {
    await this.synchronizer.initialize();
  }

  async fetch(guild: GuildResolvable): Promise<CommandGuildSettingsWrapper> {
    const id: Snowflake = resolveIdChecked(this.guildManager, guild);

    const cached = this.cache.get(id);
    if (cached) return cached;

    const syncStream = this.synchronizer.getSyncStream(id);
    const wrapper = new CommandGuildSettingsWrapper(
      this,
      syncStream,
      await this.repo.findOne(id),
      await this.guildManager.fetch(id),
      this.globalSettings
    );
    wrapper.afterUncache.subscribe(() => this.synchronizer.removeSyncStream(id));
    this.cacheWrapper(id, wrapper);
    return wrapper;
  }

  async hasDatabaseEntry(guild: GuildResolvable): Promise<boolean> {
    const id: Snowflake = resolveIdChecked(this.guildManager, guild);

    const cached = this.cache.get(id);
    if (cached) return !!cached.entity;

    return !!(await this.repo.findOne(id, {select: []}));
  }
}
