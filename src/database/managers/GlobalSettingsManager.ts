import {Connection} from 'typeorm';
import {ExitCode, exitWithError} from '../../utils/process';
import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import CacheManager from '../manager/CacheManager';
import GlobalSettingsSynchronizer from '../synchronizers/GlobalSettingsSynchronizer';
import GlobalSettingsWrapper from '../wrappers/GlobalSettingsWrapper';

export const GlobalSettingsCacheKey = 0 as const;

export default class GlobalSettingsManager extends CacheManager<
  GlobalSettingsEntity,
  GlobalSettingsWrapper,
  typeof GlobalSettingsCacheKey,
  GlobalSettingsManager
> {
  private readonly synchronizer: GlobalSettingsSynchronizer;

  constructor(connection?: Connection) {
    super(GlobalSettingsEntity, connection);
    this.synchronizer = new GlobalSettingsSynchronizer(this.repo.metadata.tableName);
  }

  async initialize(): Promise<void> {
    await this.synchronizer.initialize();
    const entity = await this.fetchEntity();
    const syncStream = this.synchronizer.getSyncStream(GlobalSettingsCacheKey);
    const wrapper = new GlobalSettingsWrapper(this, syncStream, entity);
    this.cacheWrapper(GlobalSettingsCacheKey, wrapper);
    this.synchronizer.registerGlobalSettings(wrapper);
  }

  private async fetchEntity(): Promise<GlobalSettingsEntity> {
    const result = await this.repo
      .createQueryBuilder('a')
      .innerJoin(
        qb => qb.select('MAX(version)', 'version').from(GlobalSettingsEntity, 'b'),
        'b',
        'a.version = b.version'
      )
      .getOne();
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
