import {OperatorFunction} from 'rxjs';
import {filter} from 'rxjs/operators';

/**
 * Filter `null` and `undefined` from the stream.
 */
export function filterNullAndUndefined<TValue>(): OperatorFunction<TValue, NonNullable<TValue>> {
  return source =>
    source.pipe(filter((x): x is NonNullable<typeof x> => x !== undefined && x !== null));
}
