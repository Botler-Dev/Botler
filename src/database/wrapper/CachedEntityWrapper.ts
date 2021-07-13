import {BehaviorSubject, Observable} from 'rxjs';
import {filter, first, map, skip} from 'rxjs/operators';
import {Entity, EntityWrapper} from './EntityWrapper';

/**
 * A {@link EntityWrapper} with additional cache control logic.
 */
export abstract class CachedEntityWrapper<
  TEntityState extends Entity | undefined
> extends EntityWrapper<TEntityState> {
  private isCachedSubject = new BehaviorSubject<boolean>(true);

  get isCached(): boolean {
    return this.isCachedSubject.value;
  }

  get afterDecache(): Observable<void> {
    return this.isCachedSubject.pipe(
      skip(1),
      filter(isCached => !isCached),
      map(() => {}),
      first()
    );
  }

  decache(): void {
    this.isCachedSubject.next(false);
  }
}
