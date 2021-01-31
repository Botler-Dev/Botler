export type OptionValue = unknown;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Options = Record<Key, any>;

export type SimpleOptionValueCleaner<
  TInputValue extends OptionValue,
  TOutputValue extends OptionValue,
  TKey extends Key = Key,
  TInputOptions extends Options = Options
> = (rawValue: TInputValue, key: TKey, inputOptions: TInputOptions) => TOutputValue;

export type OptionValueCleaner<
  TInputOptions extends Partial<Record<keyof TOutputOptions, OptionValue>>,
  TOutputOptions extends Options,
  TKey extends keyof TOutputOptions
> = SimpleOptionValueCleaner<TInputOptions[TKey], TOutputOptions[TKey], TKey, TInputOptions>;

export type OptionsCleanerDefinition<
  TInputOptions extends Partial<Record<keyof TOutputOptions, OptionValue>>,
  TOutputOptions extends Options
> = {
  [Key in keyof TOutputOptions]: OptionValueCleaner<TInputOptions, TOutputOptions, Key>;
};

export default function cleanOptions<
  TInputOptions extends Partial<Record<keyof TOutputOptions, OptionValue>>,
  TOutputOptions extends Options
>(
  definition: OptionsCleanerDefinition<TInputOptions, TOutputOptions>,
  raw: TInputOptions
): TOutputOptions {
  const cleaned: Partial<TOutputOptions> = {};
  Object.entries(definition).forEach(
    <TKey extends keyof TOutputOptions>([optionName, optionCleaner]: [
      TKey,
      OptionValueCleaner<TInputOptions, TOutputOptions, TKey>
    ]) => {
      cleaned[optionName] = optionCleaner(raw[optionName], optionName, raw);
    }
  );
  return cleaned as TOutputOptions;
}
