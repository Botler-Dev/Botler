export type OptionValueGenerator<InputType, OutputType> = (rawValue: InputType) => OutputType;

export type OptionValueDefinition<InputType, OutputType> =
  OptionValueGenerator<InputType, OutputType> |
  (OutputType extends ErrorConstructor ? never : ErrorConstructor) |
  (OutputType extends Function ? never :
    InputType extends OutputType ? OutputType : never);

export type OptionsDefinition<
  InputOptions extends object,
  OutputOptions extends OptionsCleanerOutput<InputOptions>
  > = {
    [Key in keyof InputOptions]-?: OptionValueDefinition<InputOptions[Key], OutputOptions[Key]>;
  };

export type OptionsCompiledDefinition<
  InputOptions extends object,
  OutputOptions extends OptionsCleanerOutput<InputOptions>
  > = Map<
    keyof InputOptions,
    OptionValueGenerator<InputOptions[keyof InputOptions], OutputOptions[keyof InputOptions]>
  >;

export type OptionsCleanerOutput<InputOptions extends object> = {
  [Key in keyof InputOptions]: any;
};

export default class OptionsCleaner<
  InputOptions extends object,
  OutputOptions extends OptionsCleanerOutput<InputOptions> = InputOptions
  > {
  private definition: OptionsCompiledDefinition<InputOptions, OutputOptions>;

  constructor(definition: OptionsDefinition<InputOptions, OutputOptions>) {
    this.definition = OptionsCleaner.compileDefinition(definition);
  }

  private static compileDefinition<
    InputOptions extends object,
    OutputOptions extends OptionsCleanerOutput<InputOptions> = InputOptions
  >(definition: OptionsDefinition<InputOptions, OutputOptions>) {
    const compiled: OptionsCompiledDefinition<InputOptions, OutputOptions> = new Map();
    Object.entries(definition).forEach(([key, value]) => {
      let generator: any = value;
      if (value === Error) {
        generator = (r: any) => {
          if (r != null) return r;
          throw new Error(`Options is missing required argument "${key}"`);
        };
      } else if (typeof value !== 'function') {
        generator = (r: any) => r ?? value;
      }
      compiled.set(<keyof InputOptions>key, generator);
    });
    return compiled;
  }

  clean(options: InputOptions) {
    const cleaned: Partial<OutputOptions> = {};
    this.definition.forEach((value, key) => {
      cleaned[<keyof OutputOptions>key] = value(options[<keyof InputOptions>key]);
    });
    return cleaned as OutputOptions;
  }
}
