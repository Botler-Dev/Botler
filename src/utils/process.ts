/* eslint-disable no-console */

export enum ExitCode {
  Success = 0,
  UnexpectedError = 1,
  InvalidConfiguration = 2,
  BotTokenChanged = 3,
}

export function exit(code: ExitCode): never {
  console.info(`Exiting with code ${code} (${ExitCode[code]}).`);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(code);
}

export function exitWithError(code: ExitCode, ...args: any[]): never {
  console.error(...args);
  exit(code);
}

export function exitWithMessage(code: ExitCode, ...args: any[]): never {
  console.info(...args);
  exit(code);
}
