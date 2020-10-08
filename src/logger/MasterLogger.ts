/* eslint-disable no-console */
import chalk, {Chalk} from 'chalk';
import dayjs from 'dayjs';

import OptionsCleaner from '../utils/OptionsCleaner';
import Logger, {LOG_LEVEL_STRINGS, LogLevel} from './Logger';

export type ConsoleColor = Parameters<Chalk['keyword']>[0] | Parameters<Chalk['rgb']>;

export type MasterLoggerConfig = {
  stampLabel?: boolean;
  scopeLabel?: boolean;
  levelLabel?: boolean;

  stampColor?: ConsoleColor;
  scopeColor?: ConsoleColor;
  levelColor?: ConsoleColor;

  labelPrefix?: string;
  labelSuffix?: string;

  stampPattern?: string;
};

export type CleanedMasterLoggerConfig = Required<MasterLoggerConfig>;

export type LogMetadata = {
  scope: string;
  level: LogLevel;
};

export type LogLevelMetadata = Omit<LogMetadata, 'level'>;

export default class MasterLogger implements Logger {
  private config: CleanedMasterLoggerConfig;

  private static readonly configCleaner = new OptionsCleaner<
    MasterLoggerConfig,
    CleanedMasterLoggerConfig
  >({
    stampLabel: true,
    scopeLabel: true,
    levelLabel: true,
    stampColor: 'gray',
    scopeColor: 'yellow',
    levelColor: 'cyan',
    labelPrefix: '[',
    labelSuffix: ']',
    stampPattern: 'YYYY/MM/DD HH:mm:ss.sss',
  });

  constructor(config: MasterLoggerConfig = {}) {
    this.config = MasterLogger.configCleaner.clean(config);
  }

  private finalizeLabel(value: string, color: ConsoleColor, minLength?: number) {
    let output = this.config.labelPrefix + value + this.config.labelSuffix;
    output = output.padEnd(minLength ?? 0, ' ');
    if (Array.isArray(color)) {
      output = chalk.rgb(...color)(output);
    } else {
      output = chalk.keyword(color)(output);
    }
    return output;
  }

  advancedLog(metadata: LogMetadata, ...objs: any[]): void {
    let metaString = '';
    if (this.config.stampLabel) {
      metaString += this.finalizeLabel(
        dayjs().utc().format(this.config.stampPattern),
        this.config.stampColor
      );
    }
    if (this.config.scopeLabel) {
      metaString += this.finalizeLabel(metadata.scope.toUpperCase(), this.config.scopeColor, 10);
    }
    const logLevel = LOG_LEVEL_STRINGS[metadata.level];
    if (this.config.levelLabel) {
      metaString += this.finalizeLabel(logLevel.toUpperCase(), this.config.levelColor, 7);
    }
    console[logLevel](metaString, ...objs);
  }

  log(metadata: LogLevelMetadata, ...objs: any[]): void {
    this.advancedLog({level: LogLevel.Log, ...metadata}, ...objs);
  }

  info(metadata: LogLevelMetadata, ...objs: any[]): void {
    this.advancedLog({level: LogLevel.Info, ...metadata}, ...objs);
  }

  warn(metadata: LogLevelMetadata, ...objs: any[]): void {
    this.advancedLog({level: LogLevel.Warn, ...metadata}, ...objs);
  }

  error(metadata: LogLevelMetadata, ...objs: any[]): void {
    this.advancedLog({level: LogLevel.Error, ...metadata}, ...objs);
  }
}
