import {GlobalSettings, Prisma} from '@prisma/client';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';
import GlobalSettingsWrapper from '../wrappers/GlobalSettingsWrapper';
import type {GlobalSettingsCacheKey} from '../managers/GlobalSettingsManager';
import DatabaseEventHub from '../DatabaseEventHub';

export default class GlobalSettingsSynchronizer extends CacheSynchronizer<
  GlobalSettings,
  'version',
  typeof GlobalSettingsCacheKey
> {
  private globalSettings?: GlobalSettingsWrapper;

  constructor(eventHub: DatabaseEventHub) {
    super(eventHub, Prisma.ModelName.GlobalSettings, ({version}) =>
      !!this.globalSettings && version >= this.globalSettings.version ? 0 : undefined
    );
  }

  registerGlobalSettings(wrapper: GlobalSettingsWrapper): void {
    this.globalSettings = wrapper;
  }

  injectNewEntity(entity: GlobalSettings): void {
    this.syncStreams.get(0)?.next(entity);
  }
}
