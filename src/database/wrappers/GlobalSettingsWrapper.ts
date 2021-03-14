import {Snowflake, UserManager, UserResolvable} from 'discord.js';
import {filter, tap} from 'rxjs/operators';
import {container} from 'tsyringe';
import {FindConditions} from 'typeorm';
import ScopedLogger from '../../logger/ScopedLogger';
import {resolveIdChecked} from '../../utils/resolve';
import GlobalSettingsEntity from '../entities/GlobalSettingsEntity';
import type GlobalSettingsManager from '../managers/GlobalSettingsManager';
import {SyncStream} from '../synchronizer/CacheSynchronizer';
import SynchronizedEntityWrapper from '../wrapper/SynchronizedEntityWrapper';

export enum ColorType {
  Default,
  Bad,
  Good,
  Warn,
}

export default class GlobalSettingsWrapper extends SynchronizedEntityWrapper<
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

  get botMasterIds(): ReadonlyArray<Snowflake> {
    return this.entity.botMasters;
  }

  get cleanInterval(): number {
    return this.entity.cleanInterval;
  }

  protected get uniqueConditions(): FindConditions<GlobalSettingsEntity> {
    return {
      version: this.version,
    };
  }

  private readonly logger: ScopedLogger;

  // Cannot get the UserManager on object creation, because then it does not exist yet.
  private _userManager?: UserManager;

  get userManager(): UserManager {
    if (!this._userManager) this._userManager = container.resolve(UserManager);
    return this._userManager;
  }

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

  isBotMaster(user: UserResolvable): boolean {
    const id = resolveIdChecked(this.userManager, user);
    return this.botMasterIds.includes(id);
  }

  getColor(type?: ColorType): number {
    switch (type) {
      default:
      case ColorType.Default:
        return this.entity.colorDefault;
      case ColorType.Good:
        return this.entity.colorGood;
      case ColorType.Bad:
        return this.entity.colorBad;
      case ColorType.Warn:
        return this.entity.colorWarn;
    }
  }
}
