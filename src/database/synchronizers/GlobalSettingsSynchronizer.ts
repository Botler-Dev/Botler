import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import CacheSynchronizer from '../synchronizer/CacheSynchronizer';
import GlobalSettingsWrapper from '../wrappers/GlobalSettingsWrapper';
import type {GlobalSettingsCacheKey} from '../managers/GlobalSettingsManager';

interface GlobalSettingsDeletePayload {
  version: number;
}

export default class GlobalSettingsSynchronizer extends CacheSynchronizer<
  GlobalSettingsEntity,
  typeof GlobalSettingsCacheKey,
  GlobalSettingsDeletePayload
> {
  private globalSettings?: GlobalSettingsWrapper;

  registerGlobalSettings(wrapper: GlobalSettingsWrapper): void {
    this.globalSettings = wrapper;
  }

  private isEventRelevant(version: number): boolean {
    return !!this.globalSettings && version >= this.globalSettings.version;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getCacheKeyFromEntity(
    entity: GlobalSettingsEntity
  ): typeof GlobalSettingsCacheKey | undefined {
    return this.isEventRelevant(entity.version) ? 0 : undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getCacheKeyFromDelete(
    payload: GlobalSettingsDeletePayload
  ): typeof GlobalSettingsCacheKey | undefined {
    return this.isEventRelevant(payload.version) ? 0 : undefined;
  }

  injectNewEntity(entity: GlobalSettingsEntity): void {
    this.syncStreams.get(0)?.next(entity);
  }
}
