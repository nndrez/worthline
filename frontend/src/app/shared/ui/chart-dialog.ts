import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DialogFrame } from './dialog-frame';
import { Card } from './card';
import { TimeSeriesChart } from './time-series-chart';
import { ChartDataTable } from './chart-data-table';
import { TimePoint, TimeSeries } from './time-series-model';
import { UiError } from '../../core/errors/api-errors';
@Component({
  selector: 'app-chart-dialog',
  imports: [DialogFrame, Card, TimeSeriesChart, ChartDataTable, TranslatePipe],
  templateUrl: './chart-dialog.html',
  styleUrl: './chart-dialog.css',
})
export class ChartDialog {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
  readonly points = input.required<readonly TimePoint[]>();
  readonly series = input.required<readonly TimeSeries[]>();
  readonly month = input('');
  protected readonly selectedMonth = linkedSignal(() => this.month());
  protected readonly highlightedMonth = linkedSignal<string | null>(() => {
    this.points();
    this.month();
    return null;
  });
  protected selectMonth(month: string): void {
    this.selectedMonth.set(month);
    this.monthSelected.emit(month);
  }
  readonly showTotal = input(false);
  readonly loading = input(false);
  readonly error = input<UiError | null>(null);
  readonly closed = output<void>();
  readonly retry = output<void>();
  readonly monthSelected = output<string>();
  protected readonly empty = computed(
    () =>
      !this.points().some((point) => Object.values(point.values).some((value) => value !== null)),
  );
}
