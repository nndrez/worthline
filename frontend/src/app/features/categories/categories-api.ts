import { inject, Injectable } from '@angular/core';
import { ApiTransport } from '../../core/http/api-transport';
import { collectPages, PageResponse, Query } from '../../core/http/page';
import { Category, CategoryRequest } from './categories.models';

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly transport = inject(ApiTransport);
  categories(query: Query = {}) {
    return this.transport.get<PageResponse<Category>>('/categories', query);
  }
  saveCategory(id: string | null, body: CategoryRequest) {
    return id
      ? this.transport.put<Category>('/categories/' + id, body)
      : this.transport.post<Category>('/categories', body);
  }
  deleteCategory(id: string) {
    return this.transport.delete('/categories/' + id);
  }
  rootOptions() {
    return collectPages((page) =>
      this.categories({ page, size: 100, rootOnly: true, sort: 'name,asc' }),
    );
  }
}
