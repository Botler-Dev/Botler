import WrapperManager from '../manager/WrapperManager';
import EntityWrapper, {Entity} from './EntityWrapper';

export default abstract class NormalEntityWrapper<
  TEntityState extends Entity | undefined,
  TManager extends WrapperManager<Exclude<TEntityState, undefined>>
> extends EntityWrapper<TEntityState, TManager> {
  private _entity: TEntityState;

  get entity(): Immutable<TEntityState> {
    return this._entity as Immutable<TEntityState>;
  }

  constructor(manager: TManager, entity: TEntityState) {
    super(manager);
    this._entity = entity;
  }

  protected setEntity(entity: TEntityState): void {
    this._entity = entity;
  }
}
