import {container} from 'tsyringe';

import Logger from './Logger';
import MasterLogger from './MasterLogger';

export default class ScopedLogger implements Logger {
  readonly scope: string;

  private readonly masterLogger: MasterLogger;

  constructor(scope: string) {
    this.scope = scope;
    this.masterLogger = container.resolve(MasterLogger);
  }

  log(...objs: any[]): void {
    this.masterLogger.log({scope: this.scope}, ...objs);
  }

  info(...objs: any[]): void {
    this.masterLogger.info({scope: this.scope}, ...objs);
  }

  warn(...objs: any[]): void {
    this.masterLogger.warn({scope: this.scope}, ...objs);
  }

  error(...objs: any[]): void {
    this.masterLogger.error({scope: this.scope}, ...objs);
  }
}
