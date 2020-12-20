export type OptionValue = any;

export type Options = Record<string, OptionValue>;

export type OptionsCleanerOutput<InputOptions extends Options> = {
  [Key in keyof InputOptions]: OptionValue;
};

export type OptionValueCleaner<Input extends OptionValue, Output extends OptionValue> = (
  rawValue: Input,
  key: string
) => Output;

export type OptionsCleanerDefinition<
  InputOptions extends Options,
  OutputOptions extends Partial<OptionsCleanerOutput<InputOptions>>
> = {
  [Key in keyof InputOptions]-?: OptionValueCleaner<InputOptions[Key], OutputOptions[Key]>;
};

export default function cleanOptions<
  InputOptions extends Options,
  OutputOptions extends Partial<OptionsCleanerOutput<InputOptions>>
>(
  definition: OptionsCleanerDefinition<InputOptions, OutputOptions>,
  raw: InputOptions
): OutputOptions {
  const cleaned: Partial<OutputOptions> = {};
  Object.entries(definition).forEach(([optionName, optionCleaner]) => {
    cleaned[optionName as keyof OutputOptions] = optionCleaner(raw[optionName], optionName);
  });
  return cleaned as OutputOptions;
}
