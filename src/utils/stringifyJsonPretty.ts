/**
 * Stringify {@link value} to JSON with indentation.
 */
export function stringifyJsonPretty(value: unknown): string {
  return JSON.stringify(value, undefined, 2);
}
