import {container} from 'tsyringe';
import ScopedLogger from '../logger/ScopedLogger';

export enum ExitCode {
  Success = 0,
  UnexpectedError = 1,
  InvalidConfiguration = 2,
}

export function exitWithError(code: ExitCode, ...args: any[]): never {
  const consoleInstance = container.resolve(ScopedLogger) ?? console;
  consoleInstance.error(...args);
  consoleInstance.info(`Exiting with code ${code}.`);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(code);
}
