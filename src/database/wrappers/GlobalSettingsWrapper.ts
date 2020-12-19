import {map, switchMap, tap} from 'rxjs/operators';
import {ExitCode, exitWithError} from '../../utils/process';
import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import {SyncStream} from '../manager/CacheManager';
import type GlobalSettingsManager from '../managers/GlobalSettingsManager';
import CacheEntityWrapper from '../wrapper/CacheEntityWrapper';

export default class GlobalSettingsWrapper
  extends CacheEntityWrapper<GlobalSettingsEntity, GlobalSettingsManager, GlobalSettingsEntity>
  implements GlobalSettingsEntity {
  get version(): number {
    return this.entity.version;
  }

  get botToken(): string {
    return this.entity.botToken;
  }

  get prefix(): string {
    return this.entity.prefix;
  }

  protected uniqueConditions = {};

  constructor(
    manager: GlobalSettingsManager,
    syncStream: SyncStream<GlobalSettingsEntity>,
    entity: GlobalSettingsEntity
  ) {
    super(
      manager,
      syncStream.pipe(
        map(newEntity => {
          if (!newEntity)
            exitWithError(ExitCode.InvalidConfiguration, 'GlobalSettings entry was deleted.');
          return newEntity;
        })
      ),
      entity
    );
  }

  // eslint-disable-next-line class-methods-use-this
  protected createDefaultEntity(): never {
    throw new Error('Cannot create default GlobalSettings entity.');
  }

  // eslint-disable-next-line class-methods-use-this
  isEntityUseless(): boolean {
    return false;
  }
}
