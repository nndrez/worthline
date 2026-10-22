import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../shared/ui/icon';
import { MoneyPipe } from '../../shared/utils/money-pipe';
import { monthEnd } from '../../shared/utils/dates';
import { Summary } from './dashboard-summary';
@Component({
  selector: 'app-cash-flow',
  imports: [RouterLink, TranslatePipe, Icon, MoneyPipe],
  templateUrl: './cash-flow.html',
  styleUrl: './cash-flow.css',
})
export class CashFlow {
  readonly summary = input.required<Summary>();
  readonly month = input.required<string>();
  protected readonly monthEnd = monthEnd;
}
