import { DataTable } from '../../shared/ui/data-table';
import { Chip } from '../../shared/ui/chip';
import { UiDatepicker } from '../../shared/ui/controls/datepicker';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { DashboardApi, DashboardData } from './dashboard-api';
import { summarize } from './dashboard-summary';
import { PageNavigation } from '../../core/http/page-navigation';
import { ApiErrors, loadState, loading } from '../../core/errors/api-errors';
import { Icon } from '../../shared/ui/icon';
import { Notice } from '../../shared/ui/notice';
import { CashFlow } from './cash-flow';
import { WealthHistory } from './wealth-history';
import { WealthAllocation } from './wealth-allocation';
import { MoneyPipe } from '../../shared/utils/money-pipe';
import { currentMonth, validMonth } from '../../shared/utils/dates';

@Component({
  imports: [
    DataTable,
    Chip,
    UiDatepicker,
    TranslatePipe,
    RouterLink,
    Icon,
    Notice,
    WealthHistory,
    WealthAllocation,
    CashFlow,
    MoneyPipe,
  ],
  providers: [PageNavigation],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly nav = inject(PageNavigation);
  private readonly api = inject(DashboardApi);
  private readonly errors = inject(ApiErrors);
  protected readonly month = computed(() => validMonth(this.nav.params().get('month')));
  protected readonly now = currentMonth();
  protected readonly state = toSignal(
    this.nav.changes$.pipe(
      switchMap(([params]) =>
        loadState(this.api.report(validMonth(params.get('month'))), this.errors),
      ),
    ),
    { initialValue: loading<DashboardData>() },
  );
  protected readonly summary = computed(() => {
    const data = this.state().data;
    return data ? summarize(data, this.month()) : null;
  });
}
