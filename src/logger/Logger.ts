export enum LogLevel {
  Log = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

export const LOG_LEVEL_STRINGS = ['log', 'info', 'warn', 'error'] as const;

interface Logger {
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}
// eslint-disable-next-line no-undef
export default Logger;
