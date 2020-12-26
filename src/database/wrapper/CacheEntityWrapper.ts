import {BehaviorSubject, Observable} from 'rxjs';
import {skip} from 'rxjs/operators';
import type CacheManager from '../manager/CacheManager';
import EntityWrapper, {Entity} from './EntityWrapper';

export default abstract class CacheEntityWrapper<
  TEntity extends Entity,
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
    return this.isCachedSubject.pipe(skip(1));
  }

  constructor(manager: TManager, syncStream: Observable<TEntityState>, entity: TEntityState) {
    super(manager);
    this.entitySubject = new BehaviorSubject(entity);
    const subscription = syncStream.subscribe(this.entitySubject);
    this.afterCacheStateChange.subscribe(() => subscription.unsubscribe());
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
