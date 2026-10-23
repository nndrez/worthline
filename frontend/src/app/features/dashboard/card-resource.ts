import { computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, switchMap } from 'rxjs';
import { ApiErrors, loading, loadState } from '../../core/errors/api-errors';
/** Each card owns its request, cancellation, error and retry independently. */
export function cardResource<T>(request: () => Observable<T>) {
  const errors = inject(ApiErrors);
  const attempt = signal(0);
  const source = computed(() => {
    attempt();
    return request();
  });
  const state = toSignal(
    toObservable(source).pipe(switchMap((source) => loadState(source, errors))),
    { initialValue: loading<T>() },
  );
  return { state, reload: () => attempt.update((value) => value + 1) };
}
