import {SimpleOptionValueCleaner} from './optionsCleaner';

export function unchecked<TRaw>(): SimpleOptionValueCleaner<TRaw, TRaw> {
  return raw => raw;
}

export function required<TRaw>(): SimpleOptionValueCleaner<TRaw, Exclude<TRaw, null | undefined>> {
  return (raw, key) => {
    if (raw === undefined || raw === null)
      throw new Error(`Options is missing required option "${String(key)}"`);
    return raw as Exclude<TRaw, null | undefined>;
  };
}

export function optional<TInput, TOutput = Exclude<TInput, undefined | null>>(
  defaultValue: TOutput
): SimpleOptionValueCleaner<TInput, TOutput> {
  return raw => {
    if (raw === undefined || raw === null) return defaultValue;
    return (raw as unknown) as TOutput;
  };
}

export function notEmpty<TRaw extends {length: number}>(): SimpleOptionValueCleaner<TRaw, TRaw> {
  return (raw, key) => {
    if (raw.length === 0) throw new Error(`Option "${String(key)}" cannot be empty.`);
    return raw;
  };
}

export function toNumber(): SimpleOptionValueCleaner<unknown, number | undefined> {
  return raw => {
    if (raw === null) return undefined;
    const number = Number(raw);
    return Number.isNaN(number) ? undefined : number;
  };
}

export function stringToBoolean(): SimpleOptionValueCleaner<
  string | undefined | null,
  boolean | undefined
> {
  return raw => {
    if (raw === undefined || raw === null) return undefined;
    if (raw.toLowerCase() === 'true') return true;
    if (raw.toLowerCase() === 'false') return false;
    return undefined;
  };
}

// Excuse the fuck ton of strange looking overloads.
// This is the only way to create save typings for interdependent list entry types
export function stack<TInput, TOutput, TO1, TO2, TO3, TO4, TO5>(
  c1: SimpleOptionValueCleaner<TInput, TO1>,
  c2: SimpleOptionValueCleaner<TO1, TO2>,
  c3: SimpleOptionValueCleaner<TO2, TO3>,
  c4: SimpleOptionValueCleaner<TO3, TO4>,
  c5: SimpleOptionValueCleaner<TO4, TO5>,
  c6: SimpleOptionValueCleaner<TO5, TOutput>
): SimpleOptionValueCleaner<TInput, TOutput>;
export function stack<TInput, TOutput, TO1, TO2, TO3, TO4>(
  c1: SimpleOptionValueCleaner<TInput, TO1>,
  c2: SimpleOptionValueCleaner<TO1, TO2>,
  c3: SimpleOptionValueCleaner<TO2, TO3>,
  c4: SimpleOptionValueCleaner<TO3, TO4>,
  c5: SimpleOptionValueCleaner<TO4, TOutput>
): SimpleOptionValueCleaner<TInput, TOutput>;
export function stack<TInput, TOutput, TO1, TO2, TO3>(
  c1: SimpleOptionValueCleaner<TInput, TO1>,
  c2: SimpleOptionValueCleaner<TO1, TO2>,
  c3: SimpleOptionValueCleaner<TO2, TO3>,
  c4: SimpleOptionValueCleaner<TO3, TOutput>
): SimpleOptionValueCleaner<TInput, TOutput>;
export function stack<TInput, TOutput, TO1, TO2>(
  c1: SimpleOptionValueCleaner<TInput, TO1>,
  c2: SimpleOptionValueCleaner<TO1, TO2>,
  c3: SimpleOptionValueCleaner<TO2, TOutput>
): SimpleOptionValueCleaner<TInput, TOutput>;
export function stack<TInput, TOutput, TO1>(
  c1: SimpleOptionValueCleaner<TInput, TO1>,
  c2: SimpleOptionValueCleaner<TO1, TOutput>
): SimpleOptionValueCleaner<TInput, TOutput>;
export function stack<TInput, TOutput>(
  c1: SimpleOptionValueCleaner<TInput, TOutput>
): SimpleOptionValueCleaner<TInput, TOutput>;
export function stack(
  ...cleaners: SimpleOptionValueCleaner<unknown, unknown>[]
): SimpleOptionValueCleaner<unknown, unknown> {
  return (raw, key, inputOptions) =>
    // eslint-disable-next-line unicorn/no-reduce
    cleaners.reduce((accumulated, nextCleaner) => nextCleaner(accumulated, key, inputOptions), raw);
}
