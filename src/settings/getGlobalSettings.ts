import {DatabaseEventHub, getLoggedSettingsWrapper} from '@/database';
import {MasterLogger} from '@/logger';
import {Prisma, PrismaClient} from '@prisma/client';
import {GlobalSettingsWrapper} from './GlobalSettingsWrapper';

export function getGlobalSettings(
  prisma: PrismaClient,
  eventHub: DatabaseEventHub,
  masterLogger: MasterLogger
): Promise<GlobalSettingsWrapper> {
  const logger = masterLogger.getScope('settings');
  return getLoggedSettingsWrapper(
    eventHub,
    logger,
    Prisma.ModelName.GlobalSettings,
    () =>
      prisma.globalSettings.findFirst({
        orderBy: {
          version: Prisma.SortOrder.desc,
        },
      }),
    (stream, entity) => new GlobalSettingsWrapper(stream, entity, logger)
  );
}
