import WrapperManager from '../manager/WrapperManager';
import EntityWrapper, {Entity} from './EntityWrapper';

export default abstract class NormalEntityWrapper<
  TEntity extends Entity,
  TManager extends WrapperManager<TEntity, EntityWrapper<TEntity, TManager, TEntityState>>,
  TEntityState extends TEntity | undefined = TEntity
> extends EntityWrapper<TEntity, TManager, TEntityState> {
  private _entity: TEntityState;

  get entity(): Immutable<TEntityState> {
    return this._entity as Immutable<TEntityState>;
  }

  constructor(manager: TManager, entity: TEntityState) {
    super(manager);
    this._entity = entity;
  }

  protected getModifiableEntity(): TEntity {
    return this._entity ?? this.createDefaultEntity();
  }

  protected setEntity(entity: TEntityState): void {
    this._entity = entity;
  }
}
