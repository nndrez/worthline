import { Component, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MoneyPipe } from '../utils/money-pipe';
import { DecimalValue } from '../utils/money';
import { monthLabel } from '../utils/dates';
import { DialogFrame } from './dialog-frame';
import { Card } from './card';
import { Icon } from './icon';
@Component({
  selector: 'app-month-comparison',
  imports: [TranslatePipe, MoneyPipe, DialogFrame, Card, Icon],
  templateUrl: './month-comparison.html',
  styleUrl: './month-comparison.css',
})
export class MonthComparison {
  readonly label = input('');
  readonly selectedMonth = input.required<string>();
  readonly selectedAmount = input<DecimalValue | null>(null);
  readonly month = input.required<string>();
  readonly amount = input<DecimalValue | null>(null);
  readonly difference = input<DecimalValue | null>(null);
  readonly inProgress = input(false);
  protected readonly open = signal(false);
  protected readonly monthLabel = monthLabel;
}
