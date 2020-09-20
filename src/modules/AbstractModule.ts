import {container, DependencyContainer} from 'tsyringe';

import ScopedLogger from '../logger/ScopedLogger';

export default abstract class AbstractModule {
  readonly name: string;

  protected readonly container: DependencyContainer;

  protected readonly logger: ScopedLogger;

  constructor(name: string) {
    this.name = name;
    this.container = container.createChildContainer();
    this.logger = new ScopedLogger(name);
    this.container.register(ScopedLogger, {useValue: this.logger});
  }

  initialize?(): Promise<void>;

  postInitialize?(): Promise<void>;
}
