import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { parse } from 'lossless-json';
import { Query } from './page';

export const API_BASE = new InjectionToken<string>('API_BASE', {
  providedIn: 'root',
  factory: () => '/api',
});

@Injectable({ providedIn: 'root' })
export class ApiTransport {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE);

  get<T>(path: string, query: Query = {}): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.request<T>('GET', path, { params });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('POST', path, { body });
  }
  put<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('PUT', path, { body });
  }
  delete(path: string): Observable<void> {
    return this.request<void>('DELETE', path, {});
  }

  private request<T>(
    method: string,
    path: string,
    options: { body?: unknown; params?: HttpParams },
  ): Observable<T> {
    return this.http
      .request(method, this.base + path, { ...options, responseType: 'text' })
      .pipe(
        map((text) =>
          text
            ? (parse(text, undefined, (value: string) =>
                !/[.eE]/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : value,
              ) as T)
            : (undefined as T),
        ),
      );
  }
}
