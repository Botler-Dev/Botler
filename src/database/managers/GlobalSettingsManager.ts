import Logger from '@/logger/Logger';
import MasterLogger from '@/logger/MasterLogger';
import {isRunningInProduction} from '@/utils/environment';
import {ExitCode, exitWithError} from '@/utils/process';
import {GlobalSettings, Prisma, PrismaClient} from '@prisma/client';
import DatabaseEventHub from '../DatabaseEventHub';
import CacheManager from '../manager/CacheManager';
import GlobalSettingsSynchronizer from '../synchronizers/GlobalSettingsSynchronizer';
import GlobalSettingsWrapper from '../wrappers/GlobalSettingsWrapper';

export const GlobalSettingsCacheKey = 0 as const;

export default class GlobalSettingsManager extends CacheManager<
  PrismaClient['globalSettings'],
  typeof GlobalSettingsCacheKey,
  GlobalSettingsWrapper
> {
  private readonly synchronizer: GlobalSettingsSynchronizer;

  private readonly logger: Logger;

  constructor(prisma: PrismaClient, masterLogger: MasterLogger, eventHub: DatabaseEventHub) {
    super(prisma.globalSettings);
    this.logger = masterLogger.getScope('settings');
    this.synchronizer = new GlobalSettingsSynchronizer(eventHub);
  }

  async initialize(): Promise<void> {
    await this.synchronizer.initialize();
    const entity = await this.fetchEntity();
    const syncStream = this.synchronizer.getSyncStream(GlobalSettingsCacheKey);
    const wrapper = new GlobalSettingsWrapper(this, syncStream, entity, this.logger);
    this.cacheWrapper(GlobalSettingsCacheKey, wrapper);
    this.synchronizer.registerGlobalSettings(wrapper);
  }

  private async fetchEntity(): Promise<GlobalSettings> {
    this.logger.info('Fetching GlobalSettings entry.');
    let result = await this.model.findFirst({
      orderBy: {
        version: Prisma.SortOrder.desc,
      },
    });
    if (!result) {
      this.logger.warn(`Could not find a GlobalSettings entry.`);
      if (isRunningInProduction)
        exitWithError(
          ExitCode.InvalidConfiguration,
          `No GlobalSettings entry in production is fatal.`
        );
      if (!process.env.DISCORD_TOKEN)
        exitWithError(
          ExitCode.InvalidConfiguration,
          `The "DISCORD_TOKEN" environment variable is not set. No GlobalSettings entry could be generated.`
        );
      this.logger.warn(`Generating a GlobalSettings entry. This would be fatal in production.`);
      result = await this.model.create({
        data: {
          discordToken: process.env.DISCORD_TOKEN,
        },
      });
    }
    return result;
  }

  async refetch(): Promise<void> {
    this.synchronizer.injectNewEntity(await this.fetchEntity());
  }

  getUnchecked(): GlobalSettingsWrapper | undefined {
    return this.cache.get(GlobalSettingsCacheKey);
  }

  get(): GlobalSettingsWrapper {
    const wrapper = this.getUnchecked();
    if (!wrapper)
      throw new Error(
        'GlobalSettings could not be retrieved synchronously. No cache entry was found.'
      );
    return wrapper;
  }
}
