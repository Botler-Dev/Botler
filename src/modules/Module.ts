import {DependencyContainer} from 'tsyringe';

import {MasterLogger, Logger} from '@/logger';
import {ModuleConstructor, ModuleResolvable, resolveModuleName} from './ModuleConstructor';
import {ModuleLoader} from './ModuleLoader';

/**
 * Modular functionality that can be easily enabled or disabled.
 */
export abstract class Module {
  /**
   * {@link this.constructor} cast to {@link ModuleConstructor} for easier access.
   * Does not guarantee that the constructor actually conforms to the interface.
   */
  get moduleConstructor(): ModuleConstructor {
    return this.constructor as ModuleConstructor;
  }

  get name(): string {
    return this.moduleConstructor.moduleName;
  }

  protected readonly container: DependencyContainer;

  protected readonly moduleLoader: ModuleLoader;

  /**
   * {@link Logger} with the scope of the module name.
   */
  protected readonly logger: Logger;

  constructor(moduleContainer: DependencyContainer) {
    this.container = moduleContainer;
    this.moduleLoader = this.container.resolve(ModuleLoader);
    // TODO: remove the dash from the kebab-case name
    this.logger = this.container.resolve(MasterLogger).getScope(this.name);
    this.container.registerInstance(Logger, this.logger);
  }

  /**
   * Gets a specific module.
   * Throws an exception if said module is not loaded or specified in {@link ModuleConstructor.requiredDependencies}.
   */
  protected getModule<TModule extends Module>(
    module: ModuleResolvable<TModule>
  ): TModule | undefined {
    Module.checkIfInDependencies(
      module,
      this.moduleConstructor.requiredDependencies,
      'requiredDependencies'
    );
    return this.moduleLoader.getModule<TModule>(module);
  }

  /**
   * Returns the specified module if it was loaded.
   * Throws and error if that module is not specified in {@link ModuleConstructor.optionalDependencies}.
   */
  protected getOptionalModule<TModule extends Module>(
    module: ModuleResolvable<TModule>
  ): TModule | undefined {
    Module.checkIfInDependencies(
      module,
      this.moduleConstructor.optionalDependencies,
      'optionalDependencies'
    );
    return this.moduleLoader.getModuleUnchecked(module);
  }

  private static checkIfInDependencies(
    module: ModuleResolvable,
    dependencies: ModuleResolvable[],
    propertyName: string
  ): void | never {
    const name = resolveModuleName(module);
    const inDependencies = dependencies.some(dependency => resolveModuleName(dependency) === name);
    if (!inDependencies)
      throw new Error(`Tried to get module "${name}" that is not in the "${propertyName}" list.`);
  }

  /**
   * Initializes asynchronous properties and classes and prepares module for consumption.
   */
  preInitialize?(): Promise<void>;

  /**
   * Consumes dependency modules and further configures the module.
   */
  initialize?(moduleLoader: ModuleLoader): Promise<void>;

  /**
   * Starts the module functionality by hooking up event listeners or
   * finishing to process requests by consumer modules.
   */
  postInitialize?(): Promise<void>;
}
