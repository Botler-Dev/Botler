/* eslint-disable no-console */
import chalk from 'chalk';
import dayjs from 'dayjs';

import {optional, stringToBoolean, toNumber, unchecked} from '../utils/optionCleaners';
import {OptionsCleanerDefinition, cleanOptions} from '../utils/optionsCleaner';
import {Logger} from './Logger';
import {LogLevel, LOG_LEVEL_STRINGS} from './LogLevel';

interface CleanedMasterLoggerConfig {
  stampLabel: boolean;
  scopeLabel: boolean;
  levelLabel: boolean;

  stampColor: string;
  scopeColor: string;
  levelColor: string;

  labelPrefix: string;
  labelSuffix: string;

  stampPad: number;
  scopePad?: number;

  stampFormat: string;
}

export type MasterLoggerConfig = Partial<CleanedMasterLoggerConfig>;

type EnvMasterLoggerConfig = {
  [option in keyof MasterLoggerConfig]: string;
};

export type LogMetadata = Readonly<{
  scope: string;
  level: LogLevel;
}>;

export type LogLevelMetadata = Omit<LogMetadata, 'level'>;

export class MasterLogger {
  private readonly config: CleanedMasterLoggerConfig;

  private maxScopeLength = 0;

  private readonly scopes = new Map<string, Logger>();

  private static readonly envCleanerDefinition: OptionsCleanerDefinition<
    EnvMasterLoggerConfig,
    MasterLoggerConfig
  > = {
    stampLabel: stringToBoolean(),
    scopeLabel: stringToBoolean(),
    levelLabel: stringToBoolean(),
    stampColor: unchecked(),
    scopeColor: unchecked(),
    levelColor: unchecked(),
    labelPrefix: unchecked(),
    labelSuffix: unchecked(),
    stampPad: toNumber(),
    scopePad: toNumber(),
    stampFormat: unchecked(),
  };

  private static readonly configCleanerDefinition: OptionsCleanerDefinition<
    MasterLoggerConfig,
    CleanedMasterLoggerConfig
  > = {
    stampLabel: optional(true),
    scopeLabel: optional(true),
    levelLabel: optional(true),
    stampColor: optional('gray'),
    scopeColor: optional('yellow'),
    levelColor: optional('cyan'),
    labelPrefix: optional('['),
    labelSuffix: optional(']'),
    stampPad: optional(0),
    scopePad: unchecked(),
    stampFormat: optional('YYYY/MM/DD HH:mm:ss.SSS'),
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

  constructor(config = MasterLogger.getEnvConfig()) {
    this.config = cleanOptions(MasterLogger.configCleanerDefinition, config);
  }

  static getEnvConfig(): MasterLoggerConfig {
    return cleanOptions(this.envCleanerDefinition, {
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

  getScope(scope: string): Logger {
    let logger = this.scopes.get(scope);
    if (logger) return logger;
    if (scope.length > this.maxScopeLength) this.maxScopeLength = scope.length;
    logger = new Logger(this, {scope});
    this.scopes.set(scope, logger);
    return logger;
  }

  private finalizeLabel(value: string, color: string, minLength?: number) {
    let output = this.config.labelPrefix + value + this.config.labelSuffix;
    output = output.padEnd(minLength ?? 0, ' ');
    output = (color.startsWith('#') ? chalk.hex(color) : chalk.keyword(color))(output);
    return output;
  }

  advancedLog(metadata: LogMetadata, ...objs: unknown[]): void {
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
        this.config.scopePad ?? this.maxScopeLength + 1
      );
    }
    const logLevel = LOG_LEVEL_STRINGS[metadata.level];
    if (this.config.levelLabel) {
      metaString += this.finalizeLabel(logLevel.toUpperCase(), this.config.levelColor, 7);
    }
    MasterLogger.originalConsole[logLevel](metaString, ...objs);
  }

  log(metadata: LogLevelMetadata, ...objs: unknown[]): void {
    this.advancedLog({...metadata, level: LogLevel.Log}, ...objs);
  }

  info(metadata: LogLevelMetadata, ...objs: unknown[]): void {
    this.advancedLog({...metadata, level: LogLevel.Info}, ...objs);
  }

  warn(metadata: LogLevelMetadata, ...objs: unknown[]): void {
    this.advancedLog({...metadata, level: LogLevel.Warn}, ...objs);
  }

  error(metadata: LogLevelMetadata, ...objs: unknown[]): void {
    this.advancedLog({...metadata, level: LogLevel.Error}, ...objs);
  }
}
