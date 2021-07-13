import produce, {Draft} from 'immer';
import {Immutable, Nothing} from 'immer/dist/internal';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, skip} from 'rxjs/operators';
import {isDeepStrictEqual} from 'util';
import {CachedEntityWrapper} from './CachedEntityWrapper';
import {Entity} from './EntityWrapper';

export type ImmerRecipe<TState> = (
  draft: Draft<TState>
) => Draft<TState> | void | undefined | (Draft<TState> extends undefined ? Nothing : never);

/**
 * A {@link CachedEntityWrapper} that also consumes a {@link SyncStream} to stay in sync with the database.
 */
export abstract class SynchronizedEntityWrapper<
  TEntityState extends Entity | undefined
> extends CachedEntityWrapper<Immutable<TEntityState>> {
  protected entitySubject: BehaviorSubject<Immutable<TEntityState>>;

  get entity(): Immutable<TEntityState> {
    return this.entitySubject.value as Immutable<TEntityState>;
  }

  get afterEntityChange(): Observable<Immutable<TEntityState>> {
    return this.entitySubject.pipe(skip(1));
  }

  get afterEntityChangeWithInitial(): Observable<Immutable<TEntityState>> {
    return this.entitySubject;
  }

  /**
   * @param syncStream {@link SyncStream} that first might to be filtered incase {@link TEntityState} does not accept undefined.
   */
  constructor(syncStream: Observable<Immutable<TEntityState>>, entity: Immutable<TEntityState>) {
    super();
    this.entitySubject = new BehaviorSubject(entity);
    const subscription = syncStream
      .pipe(filter(newEntity => !isDeepStrictEqual(newEntity, this.entity)))
      .subscribe(this.entitySubject);
    this.afterDecache.subscribe(() => subscription.unsubscribe());
  }

  protected setEntity(entity: Immutable<TEntityState>): void {
    this.entitySubject.next(entity);
  }

  protected updateEntity(
    arg1: Partial<Exclude<TEntityState, undefined>> | ImmerRecipe<Exclude<TEntityState, undefined>>
  ): void {
    this.setEntity(
      typeof arg1 === 'object'
        ? {
            ...this.defaultedEntity,
            arg1,
          }
        : produce(this.defaultedEntity, arg1)
    );
  }
}
