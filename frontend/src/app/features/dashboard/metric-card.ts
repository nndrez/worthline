import { MonthComparison } from '../../shared/ui/month-comparison';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Card } from '../../shared/ui/card';
import { Icon } from '../../shared/ui/icon';
import { MoneyPipe } from '../../shared/utils/money-pipe';
import { monthEnd, monthLabel } from '../../shared/utils/dates';
import { DashboardApi, MetricKind } from './dashboard-api';
import { TimeSeriesChart } from '../../shared/ui/time-series-chart';
import { TimePoint, TimeSeries } from '../../shared/ui/time-series-model';
import { ChartDialog } from '../../shared/ui/chart-dialog';
import { cardResource } from './card-resource';
@Component({
  selector: 'app-dashboard-metric',
  imports: [
    MonthComparison,
    Card,
    Icon,
    MoneyPipe,
    TranslatePipe,
    RouterLink,
    TimeSeriesChart,
    ChartDialog,
  ],
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.css',
})
export class DashboardMetric {
  readonly month = input.required<string>();
  readonly kind = input.required<MetricKind>();
  readonly monthSelected = output<string>();
  protected readonly detailsOpen = signal(false);
  protected readonly monthLabel = monthLabel;
  private readonly i18n = inject(TranslateService);
  private readonly api = inject(DashboardApi);
  protected readonly resource = cardResource(() => this.api.metric(this.kind(), this.month()));
  protected readonly points = computed<TimePoint[]>(() =>
    (this.resource.state().data?.history ?? []).map((point) => ({
      month: point.month,
      values: { amount: point.transactionCount ? point.amount : null },
      detail: this.i18n.instant(
        point.transactionCount ? 'common.recorded' : 'dashboard.noTransactions',
      ),
    })),
  );
  protected readonly series = computed<readonly TimeSeries[]>(() => [
    {
      key: 'amount',
      label: this.i18n.instant(this.config().label),
      color:
        this.kind() === 'income'
          ? 'var(--chart-cash)'
          : this.kind() === 'expenses'
            ? 'var(--chart-pension)'
            : 'var(--chart-investment)',
    },
  ]);
  protected readonly empty = computed(
    () =>
      this.resource.state().data !== null &&
      this.resource.state().data!.history.every((point) => point.transactionCount === 0) &&
      !this.resource.state().data!.comparison?.transactionCount,
  );
  protected readonly year = computed(() => this.month().slice(0, 4));
  protected readonly monthEnd = monthEnd;
  protected readonly config = computed(
    () =>
      ({
        income: { label: 'dashboard.income', icon: 'down' as const },
        expenses: {
          label: 'dashboard.expenses',

          icon: 'up' as const,
        },
        'cash-flow': {
          label: 'dashboard.cashFlow',

          icon: 'leaf' as const,
        },
      })[this.kind()],
  );
}
