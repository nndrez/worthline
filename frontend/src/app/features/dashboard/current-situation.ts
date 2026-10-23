import { MonthComparison } from '../../shared/ui/month-comparison';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Card } from '../../shared/ui/card';
import { SummaryList, SummaryRow } from '../../shared/ui/summary-list';
import { MoneyPipe } from '../../shared/utils/money-pipe';
import { currentMonth, displayDate, monthLabel } from '../../shared/utils/dates';
import { DashboardApi } from './dashboard-api';
import { cardResource } from './card-resource';
@Component({
  selector: 'app-current-situation',
  imports: [MonthComparison, Card, SummaryList, RouterLink, TranslatePipe, MoneyPipe],
  templateUrl: './current-situation.html',
  styleUrl: './current-situation.css',
})
export class CurrentSituationCard {
  readonly month = input.required<string>();
  protected readonly title = computed(() =>
    this.month() === currentMonth() ? 'dashboard.current' : 'dashboard.situationAt',
  );
  protected readonly monthLabel = monthLabel;
  private readonly api = inject(DashboardApi);
  protected readonly resource = cardResource(() => this.api.currentSituation(this.month()));
  private readonly i18n = inject(TranslateService);
  protected readonly rows = computed<SummaryRow[]>(() =>
    (this.resource.state().data?.accounts ?? []).map((account) => ({
      id: account.id,
      label: account.name,
      value: account.balance,
      icon: account.type === 'CASH' ? 'bank' : account.type === 'PENSION' ? 'leaf' : 'chart',
      detail:
        this.i18n.instant('types.' + account.type) +
        ' · ' +
        (account.date ? displayDate(account.date) : this.i18n.instant('dashboard.missing')),
    })),
  );
}
