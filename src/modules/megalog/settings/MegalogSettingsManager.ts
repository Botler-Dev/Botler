import {
  DatabaseEventHub,
  ModelManager,
  getTableDeleteStream,
  getTableNonDeleteStream,
} from '@/database';
import {Logger} from '@/logger';
import {MegalogSettings, Prisma, PrismaClient} from '@prisma/client';
import {merge} from 'rxjs';
import {concatMap, filter, tap} from 'rxjs/operators';
import {injectable} from 'tsyringe';
import {MegalogSettingsWrapper} from './MegalogSettingsWrapper';

/**
 * Singleton that holds and synchronizes the {@link MegalogSettingsWrapper}.
 */
@injectable()
export class MegalogSettingsManager extends ModelManager<PrismaClient['megalogSettings']> {
  private cache?: MegalogSettingsWrapper;

  private readonly logger: Logger;

  private readonly eventHub: DatabaseEventHub;

  /**
   * {@link MegalogSettingsManager.initialize} needs to be called after construction to start the functionality.
   */
  constructor(prisma: PrismaClient, logger: Logger, eventHub: DatabaseEventHub) {
    super(prisma.megalogSettings);
    this.logger = logger;
    this.eventHub = eventHub;
  }

  async initialize(): Promise<void> {
    const nonDeleteStream = (
      await getTableNonDeleteStream<MegalogSettings>(
        this.eventHub,
        Prisma.ModelName.MegalogSettings
      )
    ).pipe(
      filter(entity => !!this.cache?.version && entity.version >= this.cache?.version),
      tap(() => this.logger.info(`Detected changed or new MegalogSettings entry.`))
    );

    const deleteStream = (
      await getTableDeleteStream<Pick<MegalogSettings, 'version'>>(
        this.eventHub,
        Prisma.ModelName.MegalogSettings
      )
    ).pipe(
      filter(entity => entity.version === this.cache?.version),
      tap(() => this.logger.warn(`Detected deletion of current MegalogSettings entry.`)),
      concatMap(() => this.fetchEntity())
    );

    this.cache = new MegalogSettingsWrapper(
      merge(deleteStream, nonDeleteStream),
      await this.fetchEntity()
    );
  }

  private async fetchEntity() {
    this.logger.info(`Fetching MegalogSettings entry.`);
    return (
      (await this.model.findFirst({
        orderBy: {
          version: Prisma.SortOrder.desc,
        },
      })) ?? undefined
    );
  }

  /**
   * Gets the cached {@link MegalogSettingsWrapper} instance if it exists.
   */
  getUnchecked(): MegalogSettingsWrapper | undefined {
    return this.cache;
  }

  /**
   * Gets the cached {@link MegalogSettingsWrapper} instance or throws an error if it is not cached.
   */
  get(): MegalogSettingsWrapper {
    const wrapper = this.cache;
    if (!wrapper)
      throw new Error(
        `MegalogSettingsWrapper could not be retrieved synchronously as non was cached.`
      );
    return wrapper;
  }
}
