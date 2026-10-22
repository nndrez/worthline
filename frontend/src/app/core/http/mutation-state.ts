import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import { ApiErrors, UiError } from '../errors/api-errors';

@Injectable()
export class MutationState {
  private readonly errors = inject(ApiErrors);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal<UiError | null>(null);

  run<T>(request: Observable<T>, done: (result: T) => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: done,
        error: (failure: unknown) => this.error.set(this.errors.translate(failure)),
      });
  }
}
