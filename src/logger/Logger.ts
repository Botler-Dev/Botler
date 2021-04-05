/* eslint-disable no-console */
/* eslint-disable no-console */
import type MasterLogger from './MasterLogger';
import type {LogLevelMetadata} from './MasterLogger';

export default class Logger {
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

export function proxyNativeConsole(logger: Logger): void {
  console.log = logger.log.bind(logger);
  console.info = logger.info.bind(logger);
  console.warn = logger.warn.bind(logger);
  console.error = logger.error.bind(logger);
}
