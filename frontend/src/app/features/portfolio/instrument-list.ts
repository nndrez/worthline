import { retainTableData } from '../../core/http/retain-table-data';
import { DataTable } from '../../shared/ui/data-table';
import { Tabs } from '../../shared/ui/tabs';
import { UiInput } from '../../shared/ui/controls/input';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { map, switchMap } from 'rxjs';
import { PortfolioApi } from './portfolio-api';
import { Instrument } from './portfolio.models';
import { InstrumentEditor } from './instrument-editor';
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
    DataTable,
    Tabs,
    UiInput,
    TranslatePipe,
    Icon,
    EmptyState,
    Confirmation,
    InstrumentEditor,
  ],
  providers: [PageNavigation, MutationState],
  templateUrl: './instrument-list.html',
  styles:
    '.account-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid var(--border);border-radius:10px;background:var(--surface-alt);font-size:17px;color:var(--muted)}',
})
export class InstrumentList {
  protected readonly nav = inject(PageNavigation);
  protected readonly mutation = inject(MutationState);
  private readonly api = inject(PortfolioApi);
  private readonly errors = inject(ApiErrors);
  protected readonly editorOpen = signal(false);
  protected readonly editing = signal<Instrument | null>(null);
  protected readonly deleting = signal<Instrument | null>(null);
  protected readonly state = toSignal(
    this.nav.changes$.pipe(
      switchMap(([params]) =>
        loadState(
          this.api
            .instruments(listQuery(params, 'name,asc', ['name']))
            .pipe(map((result) => ({ result, labels: [] as { id: string; name: string }[] }))),
          this.errors,
        ),
      ),
      retainTableData(),
    ),
    {
      initialValue: loading<{
        result: PageResponse<Instrument>;
        labels: { id: string; name: string }[];
      }>(),
    },
  );

  protected edit(value: Instrument | null): void {
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
      this.mutation.run(this.api.deleteInstrument(row.id), () => {
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
