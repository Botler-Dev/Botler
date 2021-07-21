export function stringifyJsonPretty(value: unknown): string {
  return JSON.stringify(value, undefined, 2);
}
