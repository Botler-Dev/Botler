import {BehaviorSubject, Observable} from 'rxjs';
import {filter, skip} from 'rxjs/operators';
import {isDeepStrictEqual} from 'util';
import {CacheManager} from '../manager/CacheManager';
import {CachedEntityWrapper} from './CachedEntityWrapper';
import {Entity} from './EntityWrapper';

/**
 * A {@link CachedEntityWrapper} that also consumes a {@link SyncStream} to stay in sync with the database.
 */
export abstract class SynchronizedEntityWrapper<
  TEntityState extends Entity | undefined,
  TManager extends CacheManager
> extends CachedEntityWrapper<TEntityState, TManager> {
  protected entitySubject: BehaviorSubject<TEntityState>;

  get entity(): Immutable<TEntityState> {
    return this.entitySubject.value as Immutable<TEntityState>;
  }

  get afterEntityChange(): Observable<TEntityState> {
    return this.entitySubject.pipe(skip(1));
  }

  get afterEntityChangeWithInitial(): Observable<TEntityState> {
    return this.entitySubject;
  }

  /**
   * @param {Observable<TEntityState>} syncStream {@link SyncStream} that first might to be filtered incase {@link TEntityState} does not accept undefined.
   */
  constructor(manager: TManager, syncStream: Observable<TEntityState>, entity: TEntityState) {
    super(manager);
    this.entitySubject = new BehaviorSubject(entity);
    const subscription = syncStream
      .pipe(filter(newEntity => !isDeepStrictEqual(newEntity, this.entity)))
      .subscribe(this.entitySubject);
    this.afterUncache.subscribe(() => subscription.unsubscribe());
  }

  protected setEntity(entity: TEntityState): void {
    this.entitySubject.next(entity);
  }

  protected updateEntity(entity: Partial<TEntityState>): void {
    this.setEntity({
      ...this.getModifiableEntity(),
      ...entity,
    });
  }
}
