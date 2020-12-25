import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';
import type {GlobalSettingsCacheKey} from '../managers/GlobalSettingsManager';

interface GlobalSettingsDeletePayload {
  version: number;
}

export default class GlobalSettingsSynchronizer extends CacheSynchronizer<
  GlobalSettingsEntity,
  typeof GlobalSettingsCacheKey,
  GlobalSettingsDeletePayload
> {
  // eslint-disable-next-line class-methods-use-this
  protected getCacheKeyFromEntity(): typeof GlobalSettingsCacheKey {
    return 0;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getCacheKeyFromDelete(): typeof GlobalSettingsCacheKey {
    return 0;
  }
}
