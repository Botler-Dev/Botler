import {GlobalSettings, Prisma} from '@prisma/client';
import {CacheSynchronizer, DatabaseEventHub} from '../database';
import {GlobalSettingsWrapper} from './GlobalSettingsWrapper';
import type {GlobalSettingsCacheKey} from './GlobalSettingsManager';

export class GlobalSettingsSynchronizer extends CacheSynchronizer<
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
