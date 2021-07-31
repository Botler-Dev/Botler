import {GlobalSettings} from '@prisma/client';
import {Snowflake, UserManager, UserResolvable} from 'discord.js';
import {container} from 'tsyringe';
import {Immutable} from 'immer';
import {Logger} from '@/logger';
import {isRunningInProduction} from '@/utils/environment';
import {ExitCode, exitWithError} from '@/utils/process';
import {SyncStream, SettingsWrapper} from '../database';

export enum ColorType {
  Default,
  Bad,
  Good,
  Warn,
}

/**
 * Represents the global settings in the database and automatically updates when there are database changes.
 */
export class GlobalSettingsWrapper extends SettingsWrapper<GlobalSettings> {
  get discordToken(): string {
    this.logger.warn('Accessing the Discord token.');
    if (this.entity?.discordToken) {
      this.logger.info(`Using database provided Discord token.`);
      return this.entity?.discordToken;
    }
    if (isRunningInProduction)
      exitWithError(ExitCode.InvalidConfiguration, 'Discord token in the database is not set.');
    if (!process.env.DISCORD_TOKEN)
      exitWithError(
        ExitCode.InvalidConfiguration,
        'The Discord token in the database and the "DISCORD_TOKEN" environment variable are not set.'
      );
    this.logger.warn(
      `Using environment variable provided Discord token. This would be fatal in production.`
    );
    return process.env.DISCORD_TOKEN;
  }

  get masterUserIds(): ReadonlyArray<Snowflake> {
    return this.entity?.masterUserIds ?? [];
  }

  get cleanInterval(): number {
    return this.entity?.cleanInterval ?? 600_000;
  }

  private readonly logger: Logger;

  // Cannot get the UserManager on object creation, because then it does not exist yet.
  private _userManager?: UserManager;

  get userManager(): UserManager {
    if (!this._userManager) this._userManager = container.resolve(UserManager);
    return this._userManager;
  }

  constructor(
    syncStream: SyncStream<Immutable<GlobalSettings>>,
    entity: Immutable<GlobalSettings> | undefined,
    logger: Logger
  ) {
    super(syncStream, entity);
    this.logger = logger;
  }

  isBotMaster(user: UserResolvable): boolean {
    const id = this.userManager.resolveID(user);
    return !!id && this.masterUserIds.includes(id);
  }

  getColor(type: ColorType): number {
    switch (type) {
      default:
      case ColorType.Default:
        return this.entity?.colorDefault ?? 7_506_394;
      case ColorType.Good:
        return this.entity?.colorGood ?? 3_461_464;
      case ColorType.Bad:
        return this.entity?.colorBad ?? 16_718_602;
      case ColorType.Warn:
        return this.entity?.colorWarn ?? 16_745_728;
    }
  }
}
