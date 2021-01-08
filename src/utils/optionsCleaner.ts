export type OptionValue = unknown;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InputOptions = Record<string, any>;

export type OptionsCleanerOutput<TInputOptions extends InputOptions> = {
  [Key in keyof TInputOptions]: OptionValue;
};

export type OptionValueCleaner<TInput extends OptionValue, TOutput extends OptionValue> = (
  rawValue: TInput,
  key: string
) => TOutput;

export type OptionsCleanerDefinition<
  TInputOptions extends InputOptions,
  TOutputOptions extends Partial<OptionsCleanerOutput<TInputOptions>>
> = {
  [Key in keyof TInputOptions]-?: OptionValueCleaner<TInputOptions[Key], TOutputOptions[Key]>;
};

export default function cleanOptions<
  TInputOptions extends InputOptions,
  TOutputOptions extends Partial<OptionsCleanerOutput<TInputOptions>>
>(
  definition: OptionsCleanerDefinition<TInputOptions, TOutputOptions>,
  raw: TInputOptions
): TOutputOptions {
  const cleaned: Partial<TOutputOptions> = {};
  Object.entries(definition).forEach(([optionName, optionCleaner]) => {
    cleaned[optionName as keyof TOutputOptions] = optionCleaner(raw[optionName], optionName);
  });
  return cleaned as TOutputOptions;
}
