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

  log(...objs: any[]) {
    this.masterLogger.log({scope: this.scope}, ...objs);
  }

  info(...objs: any[]) {
    this.masterLogger.log({scope: this.scope}, ...objs);
  }

  warn(...objs: any[]) {
    this.masterLogger.log({scope: this.scope}, ...objs);
  }

  error(...objs: any[]) {
    this.masterLogger.log({scope: this.scope}, ...objs);
  }
}
