import {GlobalSettings, Prisma, PrismaClient} from '@prisma/client';
import Logger from '../../logger/Logger';
import {ExitCode, exitWithError} from '../../utils/process';
import DatabaseEventHub from '../DatabaseEventHub';
import CacheManager from '../manager/CacheManager';
import GlobalSettingsSynchronizer from '../synchronizers/GlobalSettingsSynchronizer';
import GlobalSettingsWrapper from '../wrappers/GlobalSettingsWrapper';

export const GlobalSettingsCacheKey = 0 as const;

// TODO: add logging
export default class GlobalSettingsManager extends CacheManager<
  PrismaClient['globalSettings'],
  typeof GlobalSettingsCacheKey,
  GlobalSettingsWrapper
> {
  private readonly synchronizer: GlobalSettingsSynchronizer;

  private readonly logger: Logger;

  constructor(prisma: PrismaClient, logger: Logger, eventHub: DatabaseEventHub) {
    super(prisma.globalSettings);
    this.logger = logger;
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
    const result = await this.model.findFirst({
      orderBy: {
        version: Prisma.SortOrder.desc,
      },
    });
    if (!result)
      exitWithError(ExitCode.InvalidConfiguration, 'Could not find a GlobalSettings entry.');
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
