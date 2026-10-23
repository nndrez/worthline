import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MoneyPipe } from '../utils/money-pipe';
import { DecimalValue } from '../utils/money';
import { Icon } from './icon';
import { DataTable } from './data-table';
export interface SummaryRow {
  id: string;
  label: string;
  detail: string;
  value: DecimalValue | null;
  icon: string;
}
/** List presentation using the shared table and scrolling behavior. */
@Component({
  selector: 'app-summary-list',
  imports: [DataTable, Icon, MoneyPipe, TranslatePipe],
  template: `<app-data-table
    density="compact"
    [contained]="false"
    [fill]="true"
    [label]="label()"
    [contentKey]="rows()"
  >
    <table class="data-table">
      <thead class="sr-only">
        <tr>
          <th scope="col">{{ 'fields.name' | translate }}</th>
          <th scope="col">{{ 'fields.amount' | translate }}</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.id) {
          <tr>
            <td>
              <div class="summary-name">
                <span class="summary-icon"><app-icon [name]="row.icon" /></span>
                <span class="summary-copy"
                  ><span>{{ row.label }}</span>
                  @if (row.detail) {
                    <small>{{ row.detail }}</small>
                  }
                </span>
              </div>
            </td>
            <td class="numeric">{{ row.value | money }}</td>
          </tr>
        }
      </tbody>
    </table>
  </app-data-table>`,
  styleUrl: './summary-list.css',
})
export class SummaryList {
  readonly rows = input.required<readonly SummaryRow[]>();
  readonly label = input.required<string>();
}
