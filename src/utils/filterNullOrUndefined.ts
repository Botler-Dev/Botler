import {OperatorFunction} from 'rxjs';
import {filter} from 'rxjs/operators';

export function filterNullOrUndefined<TValue>(): OperatorFunction<TValue, NonNullable<TValue>> {
  return source =>
    source.pipe(filter((x): x is NonNullable<typeof x> => x !== undefined && x !== null));
}
