/* eslint-disable import/prefer-default-export */

export function stringToNumberCleaner(defaultValue: number) {
  return (raw: string | undefined): number => {
    const number = Number(raw);
    if (number === undefined || Number.isNaN(number)) return defaultValue;
    return number;
  };
}

export function stringToBooleanCleaner(defaultValue: boolean) {
  return (raw: string | undefined): boolean =>
    raw !== undefined ? raw.toLocaleLowerCase() === 'true' : defaultValue;
}
