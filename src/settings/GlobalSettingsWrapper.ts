import {GlobalSettings} from '@prisma/client';
import {Snowflake, UserManager, UserResolvable} from 'discord.js';
import {filter, tap} from 'rxjs/operators';
import {container} from 'tsyringe';
import {Logger} from '@/logger';
import {resolveIdChecked} from '@/utils/resolve';
import type {GlobalSettingsManager} from './GlobalSettingsManager';
import {SyncStream, SynchronizedEntityWrapper} from '../database';

export enum ColorType {
  Default,
  Bad,
  Good,
  Warn,
}

/**
 * Represents the global settings in the database and automatically updates when there are database changes.
 */
export class GlobalSettingsWrapper extends SynchronizedEntityWrapper<GlobalSettings> {
  get version(): number {
    return this.entity.version;
  }

  get discordToken(): string {
    this.logger.warn('Discord token was accessed.');
    return this.entity.discordToken;
  }

  get defaultPrefix(): string {
    return this.entity.defaultPrefix;
  }

  set defaultPrefix(value: string) {
    this.updateEntity({defaultPrefix: value});
  }

  get masterUserIds(): ReadonlyArray<Snowflake> {
    return this.entity.masterUserIds;
  }

  get cleanInterval(): number {
    return this.entity.cleanInterval;
  }

  private readonly manager: GlobalSettingsManager;

  private readonly logger: Logger;

  // Cannot get the UserManager on object creation, because then it does not exist yet.
  private _userManager?: UserManager;

  get userManager(): UserManager {
    if (!this._userManager) this._userManager = container.resolve(UserManager);
    return this._userManager;
  }

  constructor(
    manager: GlobalSettingsManager,
    syncStream: SyncStream<GlobalSettings>,
    entity: GlobalSettings,
    logger: Logger
  ) {
    super(
      syncStream.pipe(
        tap(newEntity => {
          if (newEntity) {
            logger.info(`Current GlobalSettings entry was updated.`);
            return;
          }
          logger.info(`Current GlobalSettings entry was deleted.`);
          manager.refetch();
        }),
        filter((newEntity): newEntity is GlobalSettings => !!newEntity)
      ),
      entity
    );
    this.manager = manager;
    this.logger = logger;
  }

  protected createDefaultEntity = undefined;

  isBotMaster(user: UserResolvable): boolean {
    const id = resolveIdChecked(this.userManager, user);
    return this.masterUserIds.includes(id);
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

  async save(): Promise<void> {
    await this.manager.model.update({
      where: {
        version: this.version,
      },
      data: this.entity as GlobalSettings,
    });
  }
}
