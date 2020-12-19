import {Connection} from 'typeorm';
import {ExitCode, exitWithError} from '../../utils/process';
import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import CacheManager from '../manager/CacheManager';
import GlobalSettingsWrapper from '../wrappers/GlobalSettingsWrapper';

const GlobalSettingsCacheKey: Readonly<0> = 0;

export default class GlobalSettingsManager extends CacheManager<
  GlobalSettingsEntity,
  GlobalSettingsWrapper,
  typeof GlobalSettingsCacheKey,
  []
> {
  constructor(connection?: Connection) {
    super(GlobalSettingsEntity, connection);
  }

  // eslint-disable-next-line class-methods-use-this
  getCacheKey(): typeof GlobalSettingsCacheKey {
    return GlobalSettingsCacheKey;
  }

  async fetch(): Promise<GlobalSettingsWrapper> {
    // TODO: refactor generic wrapping and registering part into CacheManager
    let wrapper = this.cache.get(this.getCacheKey());
    if (wrapper) return wrapper;
    const entity = await this.repo.findOne();
    if (!entity)
      exitWithError(ExitCode.InvalidConfiguration, 'Could not find a GlobalSettings entry.');
    wrapper = this.wrapEntity(entity);
    this.cache.set(this.getCacheKey(), wrapper);
    return wrapper;
  }

  protected wrapEntity(entity: GlobalSettingsEntity): GlobalSettingsWrapper {
    return new GlobalSettingsWrapper(this, this.createSyncStream(this.getCacheKey()), entity);
  }

  get(): GlobalSettingsWrapper {
    const wrapper = this.cache.get(this.getCacheKey());
    if (!wrapper)
      throw new Error(
        'GlobalSettings could not be retrieved synchronously. No cache entry was found.'
      );
    return wrapper;
  }
}
