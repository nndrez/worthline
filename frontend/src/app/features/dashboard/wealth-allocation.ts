import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../shared/ui/icon';
import { MoneyPipe } from '../../shared/utils/money-pipe';

import { Summary } from './dashboard-summary';
@Component({
  selector: 'app-wealth-allocation',
  imports: [TranslatePipe, Icon, MoneyPipe],
  templateUrl: './wealth-allocation.html',
  styleUrl: './wealth-allocation.css',
})
export class WealthAllocation {
  readonly summary = input.required<Summary>();
}
