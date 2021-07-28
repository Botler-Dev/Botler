import {distinctUntilChanged, map} from 'rxjs/operators';
import {injectable} from 'tsyringe';
import {MasterLogger, Logger} from '@/logger';
import {GlobalSettingsWrapper} from '@/settings';

export type Cleaner = () => Promise<void>;

/**
 * Service that periodically executes the registered database cleaners.
 * The execution interval is specified by the {@link GlobalSettingsWrapper.cleanInterval}.
 */
@injectable()
export class DatabaseCleaner {
  private readonly cleaners = new Set<Cleaner>();

  private interval!: NodeJS.Timeout;

  private readonly logger: Logger;

  constructor(globalSettings: GlobalSettingsWrapper, masterLogger: MasterLogger) {
    this.logger = masterLogger.getScope('cleaner');
    globalSettings.afterEntityChangeWithInitial
      .pipe(
        map(() => globalSettings.cleanInterval),
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

  /**
   * Execute all cleaners
   */
  async clean(): Promise<void> {
    await Promise.allSettled(
      [...this.cleaners.values()].map(async cleaner =>
        cleaner().catch(error => this.logger.error(`Encountered error while cleaning.`, error))
      )
    );
    this.logger.log(`Cleanup performed.`);
  }
}
