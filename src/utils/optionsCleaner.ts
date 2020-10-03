export type OptionValue = ErrorConstructor | OptionValueCleaner<any, any> | any;

export type Options = Record<string, OptionValue>;

export type OptionValueCleaner<Input extends OptionValue, Output extends OptionValue> = (
  rawValue: Input
) => Output;

export type OptionValueCleanerDefinition<Input extends OptionValue, Output extends OptionValue> =
  | OptionValueCleaner<Input, Output>
  | (Output extends ErrorConstructor ? never : ErrorConstructor)
  // `Function` is here required to avoid misinterpreting any function as a cleaner function
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (Output extends Function ? never : Input extends Output ? Output : never);

export type OptionsDefinition<
  InputOptions extends Options,
  OutputOptions extends OptionsCleanerOutput<InputOptions>
> = {
  [Key in keyof InputOptions]-?: OptionValueCleanerDefinition<
    InputOptions[Key],
    OutputOptions[Key]
  >;
};

export type CompiledOptionsDefinition<
  InputOptions extends Options,
  OutputOptions extends OptionsCleanerOutput<InputOptions>
> = Map<
  keyof InputOptions,
  OptionValueCleaner<InputOptions[keyof InputOptions], OutputOptions[keyof InputOptions]>
>;

export type OptionsCleanerOutput<InputOptions extends Options> = {
  [Key in keyof InputOptions]: OptionValue;
};

export default class OptionsCleaner<
  InputOptions extends Options,
  OutputOptions extends OptionsCleanerOutput<InputOptions> = InputOptions
> {
  private definition: CompiledOptionsDefinition<InputOptions, OutputOptions>;

  constructor(definition: OptionsDefinition<InputOptions, OutputOptions>) {
    this.definition = new Map(
      Object.entries(definition).map(([optionName, optionDefinition]) => [
        optionName,
        OptionsCleaner.compileOptionDefinition(optionName, optionDefinition),
      ])
    );
  }

  private static compileOptionDefinition<Input extends OptionValue, Output extends OptionValue>(
    name: string,
    definition: OptionValueCleanerDefinition<Input, Output>
  ) {
    if (definition === Error)
      return (raw: Input) => {
        if (raw == null) throw new Error(`Options is missing required argument "${name}"`);
        return raw as Output;
      };
    if (typeof definition !== 'function') return (raw: Input) => (raw as Output) ?? definition;
    return definition as OptionValueCleaner<Input, Output>;
  }

  clean(options: InputOptions): OutputOptions {
    const cleaned: Partial<OutputOptions> = {};
    this.definition.forEach((cleaner, key) => {
      cleaned[<keyof OutputOptions>key] = cleaner(options[<keyof InputOptions>key]);
    });
    return cleaned as OutputOptions;
  }
}
