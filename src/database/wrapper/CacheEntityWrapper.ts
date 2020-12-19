import {BehaviorSubject, Observable} from 'rxjs';
import type CacheManager from '../manager/CacheManager';
import EntityWrapper from './EntityWrapper';

export default abstract class CacheEntityWrapper<
  TEntity extends Record<string, any>,
  TManager extends CacheManager<TEntity, CacheEntityWrapper<TEntity, TManager, TEntityState>>,
  TEntityState extends TEntity | undefined = TEntity
> extends EntityWrapper<TEntity, TManager, TEntityState> {
  protected entitySubject: BehaviorSubject<TEntityState>;

  get entity(): Immutable<TEntityState> {
    return this.entitySubject.value as Immutable<TEntityState>;
  }

  constructor(manager: TManager, syncStream: Observable<TEntityState>, entity: TEntityState) {
    super(manager);
    this.entitySubject = new BehaviorSubject(entity);
    syncStream.subscribe(this.entitySubject);
  }

  protected getModifiableEntity(): TEntity {
    return this.entitySubject.value ?? this.createDefaultEntity();
  }

  protected setEntity(entity: TEntityState): void {
    this.entitySubject.next(entity);
  }
}
