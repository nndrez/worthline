import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, of, startWith } from 'rxjs';

export interface UiError {
  message: string;
  requestId?: string;
  fields: string[];
}
export interface LoadState<T> {
  loading: boolean;
  data: T | null;
  error: UiError | null;
}
export function loading<T>(): LoadState<T> {
  return { loading: true, data: null, error: null };
}

@Injectable({ providedIn: 'root' })
export class ApiErrors {
  private readonly translations = inject(TranslateService);

  translate(failure: unknown): UiError {
    let key = 'errors.generic';
    let requestId: string | undefined;
    let fields: string[] = [];
    if (failure instanceof HttpErrorResponse) {
      if (
        failure.status === 0 ||
        failure.status === 502 ||
        failure.status === 503 ||
        failure.status === 504
      )
        key = 'errors.connection';
      let body: unknown = failure.error;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body) as unknown;
        } catch {
          body = null;
        }
      }
      if (body && typeof body === 'object') {
        const error = body as Record<string, unknown>;
        if (typeof error['errorCode'] === 'string') {
          const candidate = `errors.${error['errorCode']}`;
          const translation: unknown = this.translations.instant(candidate);
          if (typeof translation === 'string' && translation !== candidate) key = candidate;
        }
        if (typeof error['requestId'] === 'string') requestId = error['requestId'];
        if (Array.isArray(error['fields'])) {
          fields = error['fields'].flatMap((field: unknown) => {
            if (
              !field ||
              typeof field !== 'object' ||
              !('field' in field) ||
              typeof field.field !== 'string'
            )
              return [];
            const fieldKey = `fields.${field.field}`;
            return [
              this.translations.instant(fieldKey) === fieldKey
                ? (this.translations.instant('common.invalidField') as string)
                : (this.translations.instant(fieldKey) as string),
            ];
          });
        }
      }
    }
    return { message: this.translations.instant(key) as string, requestId, fields };
  }
}

export function loadState<T>(source: Observable<T>, errors: ApiErrors): Observable<LoadState<T>> {
  return source.pipe(
    map((data): LoadState<T> => ({ loading: false, data, error: null })),
    catchError((error: unknown) =>
      of<LoadState<T>>({ loading: false, data: null, error: errors.translate(error) }),
    ),
    startWith(loading<T>()),
  );
}
