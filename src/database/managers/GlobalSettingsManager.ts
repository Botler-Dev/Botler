import {Connection} from 'typeorm';
import {ExitCode, exitWithError} from '../../utils/process';
import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import CacheManager from '../manager/CacheManager';
import GlobalSettingsSynchronizer from '../synchronizers/GlobalSettingsSynchronizer';
import GlobalSettingsWrapper from '../wrappers/GlobalSettingsWrapper';

// TODO: Make GlobalSettingsManager use the entry with the highest version number
export const GlobalSettingsCacheKey = 0 as const;

export default class GlobalSettingsManager extends CacheManager<
  GlobalSettingsEntity,
  GlobalSettingsWrapper,
  typeof GlobalSettingsCacheKey,
  GlobalSettingsSynchronizer,
  GlobalSettingsManager
> {
  constructor(connection?: Connection) {
    // TODO: potentially make tableName dynamic
    super(GlobalSettingsEntity, new GlobalSettingsSynchronizer('GlobalSettings'), connection);
  }

  async fetch(): Promise<GlobalSettingsWrapper> {
    let wrapper = this.getUnchecked();
    if (wrapper) return wrapper;
    const entity = await this.repo.findOne();
    if (!entity)
      exitWithError(ExitCode.InvalidConfiguration, 'Could not find a GlobalSettings entry.');
    wrapper = this.registerWrapper(
      GlobalSettingsCacheKey,
      stream => new GlobalSettingsWrapper(this, stream, entity)
    );
    return wrapper;
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
