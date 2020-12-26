import {BehaviorSubject, Observable} from 'rxjs';
import type CacheManager from '../manager/CacheManager';
import EntityWrapper from './EntityWrapper';

export default abstract class CacheEntityWrapper<
  TEntity extends Record<string, any>,
  TManager extends CacheManager<TEntity, This, any, any, any>,
  TEntityState extends TEntity | undefined = TEntity,
  This extends CacheEntityWrapper<TEntity, TManager, TEntityState, This> = CacheEntityWrapper<
    TEntity,
    TManager,
    TEntityState,
    any
  >
> extends EntityWrapper<TEntity, TManager, TEntityState> {
  protected entitySubject: BehaviorSubject<TEntityState>;

  get entity(): Immutable<TEntityState> {
    return this.entitySubject.value as Immutable<TEntityState>;
  }

  private isCachedSubject = new BehaviorSubject<boolean>(true);

  get isCached(): boolean {
    return this.isCachedSubject.value;
  }

  get afterCacheStateChange(): Observable<boolean> {
    return this.isCachedSubject;
  }

  constructor(manager: TManager, syncStream: Observable<TEntityState>, entity: TEntityState) {
    super(manager);
    this.entitySubject = new BehaviorSubject(entity);
    const subscription = syncStream.subscribe(this.entitySubject);
    this.isCachedSubject.subscribe(() => subscription.unsubscribe());
  }

  protected getModifiableEntity(): TEntity {
    return this.entitySubject.value ?? this.createDefaultEntity();
  }

  protected setEntity(entity: TEntityState): void {
    this.entitySubject.next(entity);
  }

  uncache(): void {
    this.isCachedSubject.next(false);
  }
}
