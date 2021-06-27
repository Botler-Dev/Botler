/* eslint-disable no-console */
/* eslint-disable no-console */
import type {MasterLogger} from './MasterLogger';
import type {LogLevelMetadata} from './MasterLogger';

/**
 * Logger that proxies all calls with the provided {@link LogLevelMetadata} to the {@link MasterLogger}.
 */
export class Logger {
  readonly metadata: LogLevelMetadata;

  private readonly masterLogger: MasterLogger;

  constructor(masterLogger: MasterLogger, metadata: LogLevelMetadata) {
    this.masterLogger = masterLogger;
    this.metadata = metadata;
  }

  log(...objs: unknown[]): void {
    this.masterLogger.log(this.metadata, ...objs);
  }

  info(...objs: unknown[]): void {
    this.masterLogger.info(this.metadata, ...objs);
  }

  warn(...objs: unknown[]): void {
    this.masterLogger.warn(this.metadata, ...objs);
  }

  error(...objs: unknown[]): void {
    this.masterLogger.error(this.metadata, ...objs);
  }
}

/**
 * Overwrites the native console to use the provided logger.
 */
export function proxyNativeConsole(logger: Logger): void {
  console.log = Logger.prototype.log.bind(logger);
  console.info = Logger.prototype.info.bind(logger);
  console.warn = Logger.prototype.warn.bind(logger);
  console.error = Logger.prototype.error.bind(logger);
}
