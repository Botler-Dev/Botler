import WrapperManager from '../manager/WrapperManager';
import EntityWrapper from './EntityWrapper';

export default interface DiscordWrapper<
  TEntity,
  TDiscordObject,
  TManager extends WrapperManager<TEntity, EntityWrapper<TEntity, TManager>>
> extends EntityWrapper<TEntity, TManager> {
  readonly discord: TDiscordObject;
}
