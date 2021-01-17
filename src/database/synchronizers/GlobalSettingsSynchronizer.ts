import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';
import GlobalSettingsWrapper from '../wrappers/GlobalSettingsWrapper';
import type {GlobalSettingsCacheKey} from '../managers/GlobalSettingsManager';
import DatabaseEventHub from '../DatabaseEventHub';

export default class GlobalSettingsSynchronizer extends CacheSynchronizer<
  GlobalSettingsEntity,
  'version',
  typeof GlobalSettingsCacheKey
> {
  private globalSettings?: GlobalSettingsWrapper;

  constructor(tableName: string, eventHub?: DatabaseEventHub) {
    super(
      tableName,
      ({version}) =>
        !!this.globalSettings && version >= this.globalSettings.version ? 0 : undefined,
      eventHub
    );
  }

  registerGlobalSettings(wrapper: GlobalSettingsWrapper): void {
    this.globalSettings = wrapper;
  }

  injectNewEntity(entity: GlobalSettingsEntity): void {
    this.syncStreams.get(0)?.next(entity);
  }
}
