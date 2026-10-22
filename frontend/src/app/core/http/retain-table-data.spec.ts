import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { LoadState, loading } from '../errors/api-errors';
import { retainTableData } from './retain-table-data';

describe('table refresh state', () => {
  it('retains prior rows while refreshing and clears them on failure', () => {
    const source = new Subject<LoadState<string[]>>();
    const states: LoadState<string[]>[] = [];
    const subscription = source.pipe(retainTableData()).subscribe((state) => states.push(state));
    source.next(loading());
    source.next({ loading: false, data: ['first-page'], error: null });
    source.next(loading());
    source.next({ loading: false, data: ['second-page'], error: null });
    source.next(loading());
    source.next({
      loading: false,
      data: null,
      error: { message: 'Connection failed', fields: [] },
    });
    source.next(loading());
    expect(states[0].data).toBeNull();
    expect(states[2]).toEqual({ loading: true, data: ['first-page'], error: null });
    expect(states[3].data).toEqual(['second-page']);
    expect(states[4].data).toEqual(['second-page']);
    expect(states[5].data).toBeNull();
    expect(states[5].error?.message).toBe('Connection failed');
    expect(states[6].data).toBeNull();
    subscription.unsubscribe();
  });
});
