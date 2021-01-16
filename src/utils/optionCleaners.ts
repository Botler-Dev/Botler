import {OptionValueCleaner} from './optionsCleaner';

export function notCleaned<Raw>() {
  return (raw: Raw): Raw => raw;
}

export function required<Raw>() {
  return (raw: Raw, key: string): Raw | never => {
    if (raw === undefined || raw === null)
      throw new Error(`Options is missing required option "${key}"`);
    return raw;
  };
}

export function optional<Input, Output = Exclude<Input, undefined | null>>(defaultValue: Output) {
  return (raw: Input): Output => {
    if (raw === undefined || raw === null) return defaultValue;
    return (raw as unknown) as Output;
  };
}

export function notEmpty<Raw extends {length: number}>() {
  return (raw: Raw, key: string): Raw => {
    if (raw.length === 0) throw new Error(`Option "${key}" cannot be empty.`);
    return raw;
  };
}

export function toNumber<Raw>() {
  return (raw: Raw): number | undefined => {
    if (raw === null) return undefined;
    const number = Number(raw);
    return Number.isNaN(number) ? undefined : number;
  };
}

export function stringToBoolean() {
  return (raw: string | undefined | null): boolean | undefined => {
    if (raw === undefined || raw === null) return undefined;
    if (raw.toLowerCase() === 'true') return true;
    if (raw.toLowerCase() === 'false') return false;
    return undefined;
  };
}

export function stack<Input, Output>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...cleaners: OptionValueCleaner<any, any>[]
): OptionValueCleaner<Input, Output> {
  return (raw: Input, key: string) =>
    // eslint-disable-next-line unicorn/no-reduce
    cleaners.reduce(
      (accumulated: unknown, nextCleaner) => nextCleaner(accumulated, key),
      raw
    ) as Output;
}

export function optionalStringToBoolean(
  defaultValue: boolean
): OptionValueCleaner<string | null | undefined, boolean> {
  return stack<string | undefined | null, boolean>(stringToBoolean(), optional(defaultValue));
}

export function optionalToNumber<Raw>(defaultValue: number): OptionValueCleaner<Raw, number> {
  return stack<Raw, number>(toNumber<Raw>(), optional(defaultValue));
}

export function requiredToNumber<Raw>(): OptionValueCleaner<Raw, number> {
  return stack<Raw, number>(toNumber<Raw>(), required());
}
