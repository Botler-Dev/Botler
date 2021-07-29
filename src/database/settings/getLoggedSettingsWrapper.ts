import {Logger} from '@/logger';
import {DatabaseEventHub} from '../DatabaseEventHub';
import {
  getSettingsWrapper,
  SettingsEntityFetcher,
  SettingsWrapperCreator,
} from './getSettingsWrapper';
import {SettingsWrapper} from './SettingsWrapper';

export function getLoggedSettingsWrapper<TWrapper extends SettingsWrapper>(
  eventHub: DatabaseEventHub,
  logger: Logger,
  tableName: string,
  entityFetcher: SettingsEntityFetcher<TWrapper['entity']>,
  wrapperCreator: SettingsWrapperCreator<TWrapper>
): Promise<TWrapper> {
  return getSettingsWrapper(
    eventHub,
    tableName,
    () => {
      logger.info(`Fetching ${tableName} entry.`);
      return entityFetcher();
    },
    wrapperCreator,
    entity => {
      if (!entity) {
        logger.info(`Switching to no ${tableName} entry and using defaults.`);
        return;
      }
      logger.info(`Switching to new ${tableName} entry version ${entity.version}.`);
    }
  );
}
