import type {DependencyContainer} from 'tsyringe';
import type {Module} from './Module';

export type ModuleResolvable<TModule extends Module = Module> = string | ModuleConstructor<TModule>;

export function resolveModuleName(module: ModuleResolvable): string {
  return typeof module === 'string' ? module : module.moduleName;
}

/**
 * Static interface each {@link Module} class has to implement. The compatibility can be checked using the {@link StaticImplements} decorator.
 */
export interface ModuleConstructor<TModule extends Module = Module> {
  /**
   * Name used for module resolution. Should be `kebab-case`.
   */
  readonly moduleName: string;
  /**
   * List of modules this module needs to provide its base functionality.
   */
  readonly requiredDependencies: ModuleResolvable[];
  /**
   * List of modules this module can consume if available to provide additional functionality.
   */
  readonly optionalDependencies: ModuleResolvable[];
  /**
   * @param moduleContainer {@link DependencyContainer} of the module.
   */
  new (moduleContainer: DependencyContainer): TModule;
}
