import {distinctUntilChanged, map} from 'rxjs/operators';
import {injectable} from 'tsyringe';
import {MasterLogger} from '../logger/MasterLogger';
import {Logger} from '../logger/Logger';
import {GlobalSettingsWrapper} from './wrappers/GlobalSettingsWrapper';

export type Cleaner = () => Promise<void>;

@injectable()
export class DatabaseCleaner {
  private readonly cleaners = new Set<Cleaner>();

  private interval!: NodeJS.Timeout;

  private readonly logger: Logger;

  constructor(globalSettings: GlobalSettingsWrapper, masterLogger: MasterLogger) {
    this.logger = masterLogger.getScope('cleaner');
    globalSettings.afterEntityChangeWithInitial
      .pipe(
        map(entity => entity.cleanInterval),
        distinctUntilChanged()
      )
      .subscribe(interval => this.updateInterval(interval));
  }

  private updateInterval(interval: number) {
    if (this.interval !== undefined) clearInterval(this.interval);
    if (interval === 0) {
      this.logger.info(`Stopped interval.`);
      return;
    }
    this.logger.info(`Set cleanup interval to ${interval}ms.`);
    this.interval = setInterval(() => this.clean(), interval);
  }

  registerCleaner(cleaner: Cleaner): void {
    if (this.cleaners.has(cleaner))
      throw new Error(`Tried to register already registered cleaner.`);
    this.cleaners.add(cleaner);
  }

  async clean(): Promise<void> {
    await Promise.allSettled(
      [...this.cleaners.values()].map(async cleaner =>
        cleaner().catch(error => this.logger.error(`Encountered error while cleaning.`, error))
      )
    );
    this.logger.log(`Cleanup performed.`);
  }
}
