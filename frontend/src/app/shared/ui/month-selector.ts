import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiDatepicker } from './controls/datepicker';
import { currentMonth } from '../utils/dates';
@Component({
  selector: 'app-month-selector',
  imports: [UiDatepicker, TranslatePipe],
  template: `<ui-datepicker
      [inputId]="inputId()"
      [value]="value()"
      (valueChange)="valueChange.emit($event)"
      [monthOnly]="true"
      [label]="label()"
    /><button
      type="button"
      class="btn btn-secondary btn-sm"
      [disabled]="value() === now()"
      [attr.aria-label]="'common.currentMonth' | translate"
      (click)="valueChange.emit(now())"
    >
      {{ 'common.today' | translate }}
    </button>`,
  styles:
    ':host{display:flex;gap:8px;align-items:center;min-width:0}ui-datepicker{width:200px;max-width:100%;min-width:0}@media(max-width:500px){ui-datepicker{width:178px}}',
})
export class MonthSelector {
  readonly value = input.required<string>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly valueChange = output<string>();
  protected readonly now = currentMonth;
}
