import {Collection, ReadonlyCollection} from 'discord.js';
import {DependencyContainer} from 'tsyringe';
import Logger from '../logger/Logger';
import MasterLogger from '../logger/MasterLogger';
import type Module from './Module';
import {ModuleConstructor, ModuleResolvable, resolveModuleName} from './ModuleConstructor';

export default class ModuleLoader {
  protected readonly moduleConstructors: Collection<string, ModuleConstructor>;

  private readonly _modules: Collection<string, Module> = new Collection<string, Module>();

  get modules(): ReadonlyCollection<string, Module> {
    return this._modules;
  }

  readonly enabledModules?: ModuleConstructor[];

  readonly disabledModules: Set<ModuleConstructor>;

  private readonly globalContainer: DependencyContainer;

  private readonly logger: Logger;

  // TODO: implement default from environment variables or global settings
  constructor(
    container: DependencyContainer,
    masterLogger: MasterLogger,
    modules: ModuleConstructor[],
    enabledModules?: string[],
    disabledModules?: string[]
  ) {
    this.globalContainer = container;
    this.logger = masterLogger.getScope('modules');
    this.moduleConstructors = new Collection(
      modules.map(constructor => [constructor.moduleName, constructor])
    );
    this.enabledModules = enabledModules?.map(name => this.resolveModuleConstructor(name));
    this.disabledModules = new Set(
      disabledModules?.map(name => this.resolveModuleConstructor(name))
    );
    this.enabledModules
      ?.filter(constructor => this.disabledModules.has(constructor))
      .forEach(constructor => {
        throw new Error(
          `Module "${constructor.moduleName}" cannot be enabled and disabled at the same time.`
        );
      });
  }

  private resolveModuleConstructorUnchecked(
    resolvable: ModuleResolvable
  ): ModuleConstructor | undefined {
    return typeof resolvable === 'string' ? this.moduleConstructors.get(resolvable) : resolvable;
  }

  private resolveModuleConstructor(resolvable: ModuleResolvable): ModuleConstructor {
    const constructor = this.resolveModuleConstructorUnchecked(resolvable);
    if (!constructor) throw new Error(`Module "${resolvable}" could not be found.`);
    return constructor;
  }

  private resolveModulesToStart(): ModuleConstructor[] {
    const checkedModules = new Collection<ModuleConstructor, boolean>();
    if (!this.enabledModules) {
      this.moduleConstructors.forEach(constructor => this.checkModule(checkedModules, constructor));
      return [...checkedModules.filter(loadable => loadable).keys()];
    }

    const unloadableModule = this.enabledModules.find(
      name => !this.checkModule(checkedModules, name)
    );
    if (unloadableModule)
      throw new Error(
        `Module "${unloadableModule.moduleName}" was explicitly enabled but explicitly disabled modules prevent this.`
      );

    const modulesToLoad = new Set<ModuleConstructor>();
    this.enabledModules.forEach(module => this.unwrapModule(checkedModules, modulesToLoad, module));
    return [...modulesToLoad.values()];
  }

  private checkModule(
    checkedModules: Map<ModuleConstructor, boolean>,
    module: ModuleConstructor
  ): boolean {
    let loadable = checkedModules.get(module);
    if (loadable !== undefined) return loadable;
    if (this.disabledModules.has(module)) loadable = false;

    if (loadable === undefined) {
      // Incase there's a cycle dependency, it is assumed that the parent module is loadable
      // This will always be overwritten once the module loadability is determined
      checkedModules.set(module, true);

      loadable =
        module.requiredDependencies
          .map(dependency => this.resolveModuleConstructor(dependency))
          .find(constructor => !this.checkModule(checkedModules, constructor)) === undefined;

      if (loadable)
        module.optionalDependencies
          .map(dependency => {
            const constructor = this.resolveModuleConstructorUnchecked(dependency);
            if (!constructor) {
              this.logger.warn(`Optional module "${dependency}" could not be found.`);
              return undefined;
            }
            return constructor;
          })
          .filter((constructor): constructor is ModuleConstructor => !!constructor)
          .forEach(constructor => this.checkModule(checkedModules, constructor));
    }

    checkedModules.set(module, loadable);
    return loadable;
  }

  private unwrapModule(
    checkedModules: Map<ModuleConstructor, boolean>,
    accumulatedModules: Set<ModuleConstructor>,
    module: ModuleConstructor
  ) {
    if (!checkedModules.get(module) || accumulatedModules.has(module)) return;
    accumulatedModules.add(module);
    [...module.requiredDependencies, ...module.optionalDependencies]
      .map(dependency => this.resolveModuleConstructorUnchecked(dependency))
      .filter((constructor): constructor is ModuleConstructor => !!constructor)
      .forEach(constructor => this.unwrapModule(checkedModules, accumulatedModules, constructor));
  }

  async initialize(): Promise<void> {
    this.logger.info(`Enabled modules: ${this.enabledModules?.join(', ') ?? 'all'}`);
    this.logger.info(
      `Disabled modules: ${[...this.disabledModules.values()].join(', ') || 'none'}`
    );
    // TODO: thoroughly test this method once unit testing is in place
    const constructors = this.resolveModulesToStart();
    this.logger.info(
      `Loading the following modules: ${constructors.map(module => module.moduleName).join(', ')}`
    );

    constructors
      .map(constructor => new constructor(this.globalContainer.createChildContainer()))
      .forEach(module => this._modules.set(module.name, module));
    await Promise.all(this.modules.map(module => module.preInitialize?.()));
    await Promise.all(this.modules.map(module => module.initialize?.(this)));
    await Promise.all(this.modules.map(module => module.postInitialize?.()));

    this.logger.info(`Finished loading modules.`);
  }

  getModuleUnchecked<TModule extends Module>(
    module: ModuleResolvable<TModule>
  ): TModule | undefined {
    return this.modules.get(resolveModuleName(module)) as TModule | undefined;
  }

  getModule<TModule extends Module>(module: ModuleResolvable<TModule>): TModule {
    const name = resolveModuleName(module);
    const instance = this.modules.get(name) as TModule | undefined;
    if (!instance) throw new Error(`No instance of module "${name}" was found.`);
    return instance;
  }
}
