import { afterRenderEffect, Component, ElementRef, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DataTable } from './data-table';
import { TableRow } from './table-row';
import { TimePoint, TimeSeries } from './time-series-model';
import { MoneyPipe } from '../utils/money-pipe';
import { monthLabel } from '../utils/dates';
import { UiError } from '../../core/errors/api-errors';
@Component({
  selector: 'app-chart-data-table',
  imports: [TableRow, DataTable, MoneyPipe, TranslatePipe],
  templateUrl: './chart-data-table.html',
  styles:
    ':host{display:flex;flex:1;min-height:0;min-width:0;overflow:hidden}.selected-month td{background:var(--surface-alt)}.highlighted-month td{background:var(--surface-alt);box-shadow:inset 0 1px var(--border-strong),inset 0 -1px var(--border-strong)}',
})
export class ChartDataTable {
  readonly points = input.required<readonly TimePoint[]>();
  readonly series = input.required<readonly TimeSeries[]>();
  readonly label = input.required<string>();
  readonly month = input('');
  readonly highlightedMonth = input<string | null>(null);
  readonly monthHighlighted = output<string | null>();
  readonly monthSelected = output<string>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly showTotal = input(false);
  readonly loading = input(false);
  readonly error = input<UiError | null>(null);
  readonly retry = output<void>();
  protected readonly monthLabel = monthLabel;
  constructor() {
    afterRenderEffect(() => {
      const month = this.highlightedMonth();
      if (!month) return;
      const row = [...this.element.nativeElement.querySelectorAll<HTMLElement>('tbody tr')].find(
        (row) => row.dataset['month'] === month,
      );
      const viewport = row?.closest<HTMLElement>('.table-viewport');
      if (!row || !viewport) return;
      const bounds = row.getBoundingClientRect();
      const visible = viewport.getBoundingClientRect();
      const headerHeight = viewport.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      if (bounds.top < visible.top + headerHeight)
        viewport.scrollTop += bounds.top - visible.top - headerHeight;
      else if (bounds.bottom > visible.bottom) viewport.scrollTop += bounds.bottom - visible.bottom;
    });
  }
}
