import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChartDialog } from '../../shared/ui/chart-dialog';
import { Card } from '../../shared/ui/card';
import { TimeSeriesChart } from '../../shared/ui/time-series-chart';
import { TimePoint, TimeSeries } from '../../shared/ui/time-series-model';
import { DashboardApi } from './dashboard-api';
import { cardResource } from './card-resource';
@Component({
  selector: 'app-wealth-history',
  imports: [RouterLink, ChartDialog, Card, TimeSeriesChart, TranslatePipe],
  templateUrl: './wealth-history.html',
  styleUrl: './wealth-history.css',
})
export class WealthHistory {
  readonly month = input.required<string>();
  protected readonly period = signal(12);
  protected readonly detailsOpen = signal(false);
  private readonly api = inject(DashboardApi);
  private readonly i18n = inject(TranslateService);
  protected readonly resource = cardResource(() => this.api.wealth(this.month(), this.period()));
  protected readonly types = ['CASH', 'INVESTMENT', 'PENSION'] as const;
  protected readonly series: readonly TimeSeries[] = this.types.map((type) => ({
    key: type,
    label: this.i18n.instant('types.' + type),
    color: `var(--chart-${type.toLowerCase()})`,
  }));
  protected readonly points = computed<TimePoint[]>(() =>
    (this.resource.state().data?.history ?? []).map((point) => ({
      month: point.month,
      total: point.total,
      values: Object.fromEntries(
        this.types.map((type) => [
          type,
          point.groups.find((group) => group.type === type)?.total ?? null,
        ]),
      ),
      detail: this.i18n.instant(
        point.total === null
          ? 'dashboard.missing'
          : point.partial
            ? 'dashboard.partial'
            : 'common.recorded',
      ),
    })),
  );
  protected readonly empty = computed(
    () =>
      this.resource.state().data !== null &&
      this.resource.state().data!.history.every((point) => point.total === null),
  );
}
