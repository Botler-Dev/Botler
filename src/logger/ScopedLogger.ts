/* eslint-disable no-console */
import {container} from 'tsyringe';

import MasterLogger from './MasterLogger';

export default class ScopedLogger {
  readonly scope: string;

  private readonly masterLogger: MasterLogger;

  constructor(scope: string, masterLogger = container.resolve(MasterLogger)) {
    this.scope = scope;
    this.masterLogger = masterLogger;
  }

  log(...objs: unknown[]): void {
    this.masterLogger.log({scope: this.scope}, ...objs);
  }

  info(...objs: unknown[]): void {
    this.masterLogger.info({scope: this.scope}, ...objs);
  }

  warn(...objs: unknown[]): void {
    this.masterLogger.warn({scope: this.scope}, ...objs);
  }

  error(...objs: unknown[]): void {
    this.masterLogger.error({scope: this.scope}, ...objs);
  }
}

export function proxyNativeConsole(logger: ScopedLogger): void {
  console.log = logger.log.bind(logger);
  console.info = logger.info.bind(logger);
  console.warn = logger.warn.bind(logger);
  console.error = logger.error.bind(logger);
}
