enum LogLevel {
  Log = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}
export default LogLevel;

export const LOG_LEVEL_STRINGS = ['log', 'info', 'warn', 'error'] as const;
