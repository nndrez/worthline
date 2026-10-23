import { PageHeader } from '../../shared/ui/page-header';
import { Component, computed, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PanelTabs, PanelTab } from '../../shared/ui/panel-tabs';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from '../../shared/ui/icon';
import { validMonth } from '../../shared/utils/dates';
import { WealthHistory } from './wealth-history';
import { WealthAllocation } from './wealth-allocation';
import { DashboardMetric } from './metric-card';
import { PageNavigation } from '../../core/http/page-navigation';
import { MonthSelector } from '../../shared/ui/month-selector';
import { CurrentSituationCard } from './current-situation';
@Component({
  imports: [
    PageHeader,
    MonthSelector,
    PanelTabs,
    TranslatePipe,
    RouterLink,
    Icon,
    WealthHistory,
    WealthAllocation,
    DashboardMetric,
    CurrentSituationCard,
  ],
  providers: [PageNavigation],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly activePanel = signal('current');
  protected readonly compactView = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 780px), (max-height: 650px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly panels: readonly PanelTab[] = [
    { value: 'current', label: 'dashboard.currentTab' },
    { value: 'allocation', label: 'dashboard.allocationTab' },
    { value: 'wealth', label: 'dashboard.historyTab' },
  ];
  protected readonly nav = inject(PageNavigation);
  protected readonly month = computed(() => validMonth(this.nav.params().get('month')));
}
