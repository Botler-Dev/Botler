/* eslint-disable no-console */
import chalk from 'chalk';
import dayjs from 'dayjs';

import {optional, optionalStringToBoolean, optionalToNumber} from '../utils/optionCleaners';
import cleanOptions, {OptionsCleanerDefinition} from '../utils/optionsCleaner';
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

  stampFormat: string;
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

  private static readonly configCleanerDefinition: OptionsCleanerDefinition<
    RawMasterLoggerConfig,
    MasterLoggerConfig
  > = {
    stampLabel: optionalStringToBoolean(true),
    scopeLabel: optionalStringToBoolean(true),
    levelLabel: optionalStringToBoolean(true),
    stampColor: optional('gray'),
    scopeColor: optional('yellow'),
    levelColor: optional('cyan'),
    labelPrefix: optional('['),
    labelSuffix: optional(']'),
    stampPad: optionalToNumber(0),
    scopePad: optionalToNumber(10),
    stampFormat: optional('YYYY/MM/DD HH:mm:ss.sss'),
  };

  /**
   * This is required so when the native console is overwritten
   * with a ScopedLogger there is no infinite recursion
   */
  private static originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  constructor() {
    this.config = cleanOptions(MasterLogger.configCleanerDefinition, {
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
      stampFormat: process.env.LOGGER_STAMP_FORMAT,
    });
  }

  private finalizeLabel(value: string, color: string, minLength?: number) {
    let output = this.config.labelPrefix + value + this.config.labelSuffix;
    output = output.padEnd(minLength ?? 0, ' ');
    output = (color.startsWith('#') ? chalk.hex(color) : chalk.keyword(color))(output);
    return output;
  }

  advancedLog(metadata: LogMetadata, ...objs: any[]): void {
    let metaString = '';
    if (this.config.stampLabel) {
      metaString += this.finalizeLabel(
        dayjs().utc().format(this.config.stampFormat),
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
    MasterLogger.originalConsole[logLevel](metaString, ...objs);
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
