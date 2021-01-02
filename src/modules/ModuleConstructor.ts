import type {DependencyContainer} from 'tsyringe';
import type Module from './Module';

export type ModuleResolvable<TModule extends Module = Module> = string | ModuleConstructor<TModule>;

export function resolveModuleName(module: ModuleResolvable): string {
  return typeof module === 'string' ? module : module.moduleName;
}

export interface ModuleConstructor<TModule extends Module = Module> {
  readonly moduleName: string;
  readonly requiredDependencies: ModuleResolvable[];
  readonly optionalDependencies: ModuleResolvable[];
  new (moduleContainer: DependencyContainer): TModule;
}
