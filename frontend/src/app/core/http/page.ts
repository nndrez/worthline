import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

export interface PageMetadata {
  currentPage: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: PageMetadata;
}

export type Query = Readonly<Record<string, string | number | boolean | undefined>>;

export function pageIndex(page: PageMetadata): number {
  return Math.max(0, page.currentPage - 1);
}

// Only for bounded reporting datasets and reference pickers, never ordinary tables.
export function collectPages<T>(
  read: (index: number) => Observable<PageResponse<T>>,
): Observable<T[]> {
  return read(0).pipe(
    expand((result) => (result.page.last ? EMPTY : read(result.page.currentPage))),
    map((result) => result.content),
    reduce((all, rows) => [...all, ...rows], [] as T[]),
  );
}
