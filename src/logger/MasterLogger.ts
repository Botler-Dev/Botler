/* eslint-disable no-console */
import chalk from 'chalk';
import dayjs from 'dayjs';

import {stringToBooleanCleaner, stringToNumberCleaner} from '../utils/cleaners';
import OptionsCleaner from '../utils/OptionsCleaner';
import Logger, {LOG_LEVEL_STRINGS, LogLevel} from './Logger';

export type MasterLoggerConfig = {
  stampLabel: boolean;
  scopeLabel: boolean;
  levelLabel: boolean;

  stampColor: string;
  scopeColor: string;
  levelColor: string;

  labelPrefix: string;
  labelSuffix: string;

  stampPad: number;
  scopePad: number;

  stampPattern: string;
};

export type RawMasterLoggerConfig = {
  [option in keyof MasterLoggerConfig]?: string;
};

export type LogMetadata = {
  scope: string;
  level: LogLevel;
};

export type LogLevelMetadata = Omit<LogMetadata, 'level'>;

export default class MasterLogger implements Logger {
  private config: MasterLoggerConfig;

  private static readonly configCleaner = new OptionsCleaner<
    RawMasterLoggerConfig,
    MasterLoggerConfig
  >({
    stampLabel: stringToBooleanCleaner(true),
    scopeLabel: stringToBooleanCleaner(true),
    levelLabel: stringToBooleanCleaner(true),
    stampColor: 'gray',
    scopeColor: 'yellow',
    levelColor: 'cyan',
    labelPrefix: '[',
    labelSuffix: ']',
    stampPad: stringToNumberCleaner(0),
    scopePad: stringToNumberCleaner(10),
    stampPattern: 'YYYY/MM/DD HH:mm:ss.sss',
  });

  constructor() {
    this.config = MasterLogger.configCleaner.clean({
      stampLabel: process.env.LOGGER_STAMP_LABEL,
      scopeLabel: process.env.LOGGER_SCOPE_LABEL,
      levelLabel: process.env.LOGGER_LEVEL_LABEL,
      stampColor: process.env.LOGGER_STAMP_COLOR,
      scopeColor: process.env.LOGGER_SCOPE_COLOR,
      levelColor: process.env.LOGGER_LEVEL_COLOR,
      labelPrefix: process.env.LOGGER_LABEL_PREFIX,
      labelSuffix: process.env.LOGGER_LABEL_SUFFIX,
      stampPad: process.env.LOGGER_STAMP_PAD,
      scopePad: process.env.LOGGER_SCOPE_PAD,
      stampPattern: process.env.LOGGER_STAMP_PATTERN,
    });
  }

  private finalizeLabel(value: string, color: string, minLength?: number) {
    let output = this.config.labelPrefix + value + this.config.labelSuffix;
    output = output.padEnd(minLength ?? 0, ' ');
    if (color.startsWith('#')) {
      output = chalk.hex(color)(output);
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
        this.config.stampColor,
        this.config.stampPad
      );
    }
    if (this.config.scopeLabel) {
      metaString += this.finalizeLabel(
        metadata.scope.toUpperCase(),
        this.config.scopeColor,
        this.config.scopePad
      );
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
