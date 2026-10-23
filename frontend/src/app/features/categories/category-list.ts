import { TableRow } from '../../shared/ui/table-row';
import { PageHeader } from '../../shared/ui/page-header';
import { retainTableData } from '../../core/http/retain-table-data';
import { DataTable } from '../../shared/ui/data-table';
import { Chip } from '../../shared/ui/chip';
import { UiInput } from '../../shared/ui/controls/input';
import { UiSelect } from '../../shared/ui/controls/select';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { TranslatePipe } from '@ngx-translate/core';
import { map, switchMap } from 'rxjs';
import { CategoriesApi } from './categories-api';
import { Category } from './categories.models';
import { CategoryEditor } from './category-editor';
import { PageNavigation, listQuery } from '../../core/http/page-navigation';
import { PageResponse } from '../../core/http/page';
import { MutationState } from '../../core/http/mutation-state';
import { ApiErrors, loadState, loading } from '../../core/errors/api-errors';
import { Icon } from '../../shared/ui/icon';
import { EmptyState } from '../../shared/ui/empty-state';
import { Confirmation } from '../../shared/ui/confirmation';

@Component({
  host: { class: 'list-page' },
  imports: [
    TableRow,
    PageHeader,
    DataTable,
    Chip,
    UiSelect,
    UiInput,
    TranslatePipe,
    Icon,
    EmptyState,
    Confirmation,
    CategoryEditor,
  ],
  providers: [PageNavigation, MutationState],
  templateUrl: './category-list.html',
  styles:
    '.account-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid var(--border);border-radius:10px;background:var(--surface-alt);font-size:17px;color:var(--muted)}',
})
export class CategoryList {
  protected readonly nav = inject(PageNavigation);
  protected readonly mutation = inject(MutationState);
  private readonly api = inject(CategoriesApi);
  private readonly errors = inject(ApiErrors);
  protected readonly editorOpen = signal(false);
  protected readonly editing = signal<Category | null>(null);
  protected readonly deleting = signal<Category | null>(null);
  protected readonly state = toSignal(
    this.nav.changes$.pipe(
      switchMap(([params]) =>
        loadState(
          this.api
            .categories(listQuery(params, 'name,asc', ['name', 'type']))
            .pipe(map((result) => ({ result, labels: [] as { id: string; name: string }[] }))),
          this.errors,
        ),
      ),
      retainTableData(),
    ),
    {
      initialValue: loading<{
        result: PageResponse<Category>;
        labels: { id: string; name: string }[];
      }>(),
    },
  );

  protected edit(value: Category | null): void {
    this.editing.set(value);
    this.editorOpen.set(true);
  }
  protected saved(): void {
    this.editorOpen.set(false);
    this.nav.reload();
  }
  protected confirmDelete(): void {
    const row = this.deleting();
    if (row)
      this.mutation.run(this.api.deleteCategory(row.id), () => {
        this.deleting.set(null);
        this.nav.reload();
      });
  }
  protected sortDirection(field: string): 'none' | 'ascending' | 'descending' {
    const [current, direction] = (this.nav.params().get('sort') || 'name,asc').split(',');
    return current !== field ? 'none' : direction === 'desc' ? 'descending' : 'ascending';
  }
  protected sort(field: string): void {
    const current = this.nav.params().get('sort') || 'name,asc';
    this.nav.update({ sort: field + (current === field + ',asc' ? ',desc' : ',asc'), page: null });
  }
}
