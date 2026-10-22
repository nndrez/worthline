import { DataTable } from '../../shared/ui/data-table';
import { Component, computed, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../shared/ui/icon';
import { MoneyPipe } from '../../shared/utils/money-pipe';
import { EmptyState } from '../../shared/ui/empty-state';
import { monthLabel } from '../../shared/utils/dates';
import { chartModel, Summary } from './dashboard-summary';
@Component({
  selector: 'app-wealth-history',
  imports: [DataTable, TranslatePipe, Icon, MoneyPipe, EmptyState],
  templateUrl: './wealth-history.html',
  styleUrl: './wealth-history.css',
})
export class WealthHistory {
  readonly summary = input.required<Summary>();
  readonly month = input.required<string>();
  protected readonly period = signal(6);
  protected readonly monthLabel = monthLabel;
  protected readonly chart = computed(() =>
    chartModel(this.summary().history.slice(-this.period())),
  );
}
