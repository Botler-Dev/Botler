import {DependencyContainer} from 'tsyringe';

import ScopedLogger from '../logger/ScopedLogger';
import {ModuleConstructor, ModuleResolvable, resolveModuleName} from './ModuleConstructor';
import ModuleLoader from './ModuleLoader';

export default abstract class Module {
  get moduleConstructor(): ModuleConstructor {
    return this.constructor as ModuleConstructor;
  }

  get name(): string {
    return this.moduleConstructor.moduleName;
  }

  protected readonly container: DependencyContainer;

  protected readonly moduleLoader: ModuleLoader;

  protected readonly logger: ScopedLogger;

  constructor(moduleContainer: DependencyContainer) {
    this.container = moduleContainer;
    this.moduleLoader = this.container.resolve(ModuleLoader);
    this.logger = new ScopedLogger(this.name);
    this.container.registerInstance(ScopedLogger, this.logger);
  }

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
    const inDependencies = !!dependencies.find(
      dependency => resolveModuleName(dependency) === name
    );
    if (!inDependencies)
      throw new Error(`Tried to get module "${name}" that is not in the "${propertyName}" list.`);
  }

  preInitialize?(): Promise<void>;

  initialize?(): Promise<void>;

  postInitialize?(): Promise<void>;
}
