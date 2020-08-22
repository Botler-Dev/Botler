export type OptionValueGenerator<Type> = (rawValue: Type) => Type;

export type OptionValueDefinition<Type> =
  Type extends Function ? OptionValueGenerator<Type> :
  Type extends ErrorConstructor ? OptionValueGenerator<Type> :
  (OptionValueGenerator<Type> | Type | ErrorConstructor);

export type OptionsDefinition<Options extends object> = {
  [Key in keyof Options]-?: OptionValueDefinition<Options[Key]>;
};

export type OptionsCompiledDefinition<Options extends object> =
  Map<keyof Options, OptionValueGenerator<Options[keyof Options]>>;

export default class OptionsCleaner<Options extends object> {
  private definition: OptionsCompiledDefinition<Options>;

  constructor(definition: OptionsDefinition<Options>) {
    this.definition = OptionsCleaner.compileDefinition(definition);
  }

  private static compileDefinition<Options extends object>(definition: OptionsDefinition<Options>) {
    const compiled: OptionsCompiledDefinition<Options> = new Map();
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
      compiled.set(<keyof Options>key, generator);
    });
    return compiled;
  }

  clean(options: Options) {
    const cleaned: Partial<Options> = {};
    this.definition.forEach((value, key) => {
      cleaned[<keyof Options>key] = value(options[<keyof Options>key]);
    });
    return cleaned as Options;
  }
}
