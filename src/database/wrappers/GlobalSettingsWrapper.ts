import {filter, tap} from 'rxjs/operators';
import {container} from 'tsyringe';
import {FindConditions} from 'typeorm';
import ScopedLogger from '../../logger/ScopedLogger';
import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import type GlobalSettingsManager from '../managers/GlobalSettingsManager';
import {SyncStream} from '../synchronizer/CacheSynchronizer';
import CacheEntityWrapper from '../wrapper/CacheEntityWrapper';

export default class GlobalSettingsWrapper extends CacheEntityWrapper<
  GlobalSettingsEntity,
  GlobalSettingsManager
> {
  get version(): number {
    return this.entity.version;
  }

  get botToken(): string {
    this.logger.warn('Bot token was accessed.');
    return this.entity.botToken;
  }

  get prefix(): string {
    return this.entity.prefix;
  }

  set prefix(prefix: string) {
    this.updateEntity({prefix});
  }

  protected get uniqueConditions(): FindConditions<GlobalSettingsEntity> {
    return {
      version: this.version,
    };
  }

  private readonly logger: ScopedLogger;

  constructor(
    manager: GlobalSettingsManager,
    syncStream: SyncStream<GlobalSettingsEntity>,
    entity: GlobalSettingsEntity,
    logger = container.resolve(ScopedLogger)
  ) {
    super(
      manager,
      syncStream.pipe(
        tap(newEntity => {
          if (newEntity) return;
          this.manager.refetch();
        }),
        filter((newEntity): newEntity is GlobalSettingsEntity => !!newEntity)
      ),
      entity
    );
    this.logger = logger;
  }

  protected createDefaultEntity = undefined;

  // eslint-disable-next-line class-methods-use-this
  isEntityUseless(): boolean {
    return false;
  }
}
