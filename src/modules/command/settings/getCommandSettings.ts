import {DatabaseEventHub, getLoggedSettingsWrapper} from '@/database';
import {Logger} from '@/logger';
import {Prisma, PrismaClient} from '@prisma/client';
import {CommandSettingsWrapper} from './CommandSettingsWrapper';

export function getCommandSettings(
  prisma: PrismaClient,
  eventHub: DatabaseEventHub,
  logger: Logger
): Promise<CommandSettingsWrapper> {
  return getLoggedSettingsWrapper(
    eventHub,
    logger,
    Prisma.ModelName.CommandSettings,
    () =>
      prisma.commandSettings.findFirst({
        orderBy: {
          version: Prisma.SortOrder.desc,
        },
      }),
    (stream, entity) => new CommandSettingsWrapper(stream, entity)
  );
}
