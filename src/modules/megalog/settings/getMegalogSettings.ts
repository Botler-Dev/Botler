import {DatabaseEventHub, getLoggedSettingsWrapper} from '@/database';
import {Logger} from '@/logger';
import {Prisma, PrismaClient} from '@prisma/client';
import {MegalogSettingsWrapper} from './MegalogSettingsWrapper';

export function getMegalogSettings(
  prisma: PrismaClient,
  eventHub: DatabaseEventHub,
  logger: Logger
): Promise<MegalogSettingsWrapper> {
  return getLoggedSettingsWrapper(
    eventHub,
    logger,
    Prisma.ModelName.MegalogSettings,
    () =>
      prisma.megalogSettings.findFirst({
        orderBy: {
          version: Prisma.SortOrder.desc,
        },
      }),
    (stream, entity) => new MegalogSettingsWrapper(stream, entity)
  );
}
