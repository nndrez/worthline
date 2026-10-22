import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Query } from './page';

export function listQuery(params: ParamMap, sort: string, filters: readonly string[]): Query {
  const page = Number(params.get('page'));
  const query: Record<string, string | number | undefined> = {
    page: Number.isSafeInteger(page) && page >= 0 ? page : 0,
    size: 12,
    sort: params.get('sort') || sort,
  };
  for (const key of filters) query[key] = params.get(key) || undefined;
  return query;
}

@Injectable()
export class PageNavigation {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly refresh = new BehaviorSubject(0);
  private readonly searchInput = new Subject<{ key: string; value: string }>();
  readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly changes$ = combineLatest([this.route.queryParamMap, this.refresh]);

  constructor() {
    this.searchInput
      .pipe(
        debounceTime(250),
        distinctUntilChanged((a, b) => a.key === b.key && a.value === b.value),
        takeUntilDestroyed(),
      )
      .subscribe(({ key, value }) => this.update({ [key]: value || null, page: null }));
  }

  update(patch: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: patch,
      queryParamsHandling: 'merge',
    });
  }
  search(key: string, value: string): void {
    this.searchInput.next({ key, value });
  }
  reload(): void {
    this.refresh.next(this.refresh.value + 1);
  }
  clear(): void {
    void this.router.navigate([], { relativeTo: this.route });
  }
}
