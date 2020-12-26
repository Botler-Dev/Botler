import WrapperManager from '../manager/WrapperManager';
import EntityWrapper, {Entity} from './EntityWrapper';

export default interface DiscordWrapper<
  TEntity extends Entity,
  TDiscordObject,
  TManager extends WrapperManager<TEntity, EntityWrapper<TEntity, TManager>>
> extends EntityWrapper<TEntity, TManager> {
  readonly discord: TDiscordObject;
}
