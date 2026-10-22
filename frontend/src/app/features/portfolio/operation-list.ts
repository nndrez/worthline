import { retainTableData } from '../../core/http/retain-table-data';
import { DataTable } from '../../shared/ui/data-table';
import { Tabs } from '../../shared/ui/tabs';
import { Chip } from '../../shared/ui/chip';
import { UiInput } from '../../shared/ui/controls/input';
import { UiDateRangePicker } from '../../shared/ui/controls/date-range-picker';
import { UiSelect } from '../../shared/ui/controls/select';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin, switchMap } from 'rxjs';
import { PortfolioApi } from './portfolio-api';
import { Operation, Instrument } from './portfolio.models';
import { OperationEditor } from './operation-editor';
import { PageNavigation, listQuery } from '../../core/http/page-navigation';
import { PageResponse } from '../../core/http/page';
import { MutationState } from '../../core/http/mutation-state';
import { ApiErrors, loadState, loading } from '../../core/errors/api-errors';
import { Icon } from '../../shared/ui/icon';
import { EmptyState } from '../../shared/ui/empty-state';
import { Confirmation } from '../../shared/ui/confirmation';
import { MoneyPipe } from '../../shared/utils/money-pipe';
import { displayDate } from '../../shared/utils/dates';

@Component({
  host: { class: 'list-page' },
  imports: [
    DataTable,
    Tabs,
    Chip,
    UiSelect,
    UiDateRangePicker,
    UiInput,
    TranslatePipe,
    Icon,
    EmptyState,
    Confirmation,
    MoneyPipe,
    OperationEditor,
  ],
  providers: [PageNavigation, MutationState],
  templateUrl: './operation-list.html',
  styles:
    '.account-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid var(--border);border-radius:10px;background:var(--surface-alt);font-size:17px;color:var(--muted)}',
})
export class OperationList {
  protected readonly nav = inject(PageNavigation);
  protected readonly mutation = inject(MutationState);
  private readonly api = inject(PortfolioApi);
  private readonly errors = inject(ApiErrors);
  protected readonly editorOpen = signal(false);
  protected readonly editing = signal<Operation | null>(null);
  protected readonly deleting = signal<Operation | null>(null);
  protected readonly dateLabel = displayDate;
  protected readonly state = toSignal(
    this.nav.changes$.pipe(
      switchMap(([params]) =>
        loadState(
          forkJoin({
            result: this.api.operations(
              listQuery(params, 'date,desc', ['broker', 'type', 'from', 'to', 'instrumentId']),
            ),
            labels: this.api.instrumentOptions(),
          }),
          this.errors,
        ),
      ),
      retainTableData(),
    ),
    { initialValue: loading<{ result: PageResponse<Operation>; labels: Instrument[] }>() },
  );

  protected edit(value: Operation | null): void {
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
      this.mutation.run(this.api.deleteOperation(row.id), () => {
        this.deleting.set(null);
        this.nav.reload();
      });
  }
  protected referenceName(id: string): string {
    return this.state().data?.labels.find((option) => option.id === id)?.name || '—';
  }
  protected sortDirection(field: string): 'none' | 'ascending' | 'descending' {
    const [current, direction] = (this.nav.params().get('sort') || 'date,desc').split(',');
    return current !== field ? 'none' : direction === 'desc' ? 'descending' : 'ascending';
  }
  protected sort(field: string): void {
    const current = this.nav.params().get('sort') || 'date,desc';
    this.nav.update({ sort: field + (current === field + ',asc' ? ',desc' : ',asc'), page: null });
  }
}
