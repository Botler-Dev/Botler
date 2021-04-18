import {DependencyContainer} from 'tsyringe';

import Logger from '../logger/Logger';
import MasterLogger from '../logger/MasterLogger';
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

  protected readonly logger: Logger;

  constructor(moduleContainer: DependencyContainer) {
    this.container = moduleContainer;
    this.moduleLoader = this.container.resolve(ModuleLoader);
    this.logger = this.container.resolve(MasterLogger).getScope(this.name);
    this.container.registerInstance(Logger, this.logger);
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
    const inDependencies = dependencies.some(dependency => resolveModuleName(dependency) === name);
    if (!inDependencies)
      throw new Error(`Tried to get module "${name}" that is not in the "${propertyName}" list.`);
  }

  preInitialize?(): Promise<void>;

  initialize?(moduleLoader: ModuleLoader): Promise<void>;

  postInitialize?(): Promise<void>;
}
