import { OperatorFunction, scan } from 'rxjs';
import { LoadState, loading } from '../errors/api-errors';

/** Keep previous rows only during a refresh; errors must not display stale results. */
export function retainTableData<T>(): OperatorFunction<LoadState<T>, LoadState<T>> {
  return scan(
    (previous: LoadState<T>, next: LoadState<T>) =>
      next.loading ? { ...next, data: previous.data } : next,
    loading<T>(),
  );
}
