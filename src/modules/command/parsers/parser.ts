import {notCleaned} from '../../../utils/optionCleaners';
import {OptionsCleanerDefinition} from '../../../utils/optionsCleaner';

export interface ParseOptions<TValue = unknown> {
  default?: TValue;
}

export const parseOptionsDefinition: OptionsCleanerDefinition<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ParseOptions<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ParseOptions<any>
> = {
  default: notCleaned(),
};

export interface ParseResult<TValue = unknown> {
  value: TValue;
  length: number;
}

export type Parser<TValue = unknown> = (raw: string) => Promise<ParseResult<TValue> | undefined>;

export function parseTrimStart(raw: string): ParseResult<string> {
  const trimmed = raw.trimStart();
  return {
    value: trimmed,
    length: raw.length - trimmed.length,
  };
}

export function generateDefaultOrNothing<TValue>(
  options: ParseOptions<TValue>
): ParseResult<TValue> | undefined {
  if (options.default === undefined) return undefined;
  return {
    value: options.default,
    length: 0,
  };
}
