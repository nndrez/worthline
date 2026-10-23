import { Component, computed, inject, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrors, loading, loadState } from '../../core/errors/api-errors';
import { DialogFrame } from '../../shared/ui/dialog-frame';
import { Card } from '../../shared/ui/card';
import { DetailFields } from '../../shared/ui/detail-fields';
import { SummaryList, SummaryRow } from '../../shared/ui/summary-list';
import { PortfolioApi } from './portfolio-api';
import { InstrumentSummary as Summary } from './portfolio.models';
@Component({
  selector: 'app-instrument-summary',
  imports: [DialogFrame, Card, DetailFields, SummaryList, TranslatePipe, RouterLink],
  templateUrl: './instrument-summary.html',
  styles:
    ':host{display:contents}h3{font-size:20px;margin:0 0 20px}app-card{margin-top:20px;display:block}.dialog-actions{flex-wrap:wrap}.summary-content{padding:20px}',
})
export class InstrumentSummary {
  readonly id = input.required<string>();
  readonly closed = output<void>();
  readonly editRequested = output<void>();
  private readonly api = inject(PortfolioApi);
  private readonly errors = inject(ApiErrors);
  private readonly i18n = inject(TranslateService);
  private readonly attempt = signal(0);
  private readonly request = computed(() => {
    this.attempt();
    return this.id();
  });
  protected readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap((id) => loadState(this.api.instrumentSummary(id), this.errors)),
    ),
    { initialValue: loading<Summary>() },
  );
  protected reload(): void {
    this.attempt.update((value) => value + 1);
  }
  protected readonly fields = computed(() => {
    const data = this.state().data;
    return data
      ? [
          { label: this.i18n.instant('fields.code'), value: data.instrument.code },
          { label: this.i18n.instant('fields.ticker'), value: data.instrument.ticker ?? '' },
          { label: this.i18n.instant('fields.isin'), value: data.instrument.isin ?? '' },
          {
            label: this.i18n.instant('instruments.netQuantity'),
            value: new Intl.NumberFormat('it-IT', { maximumFractionDigits: 6 }).format(
              Number(data.quantity),
            ),
          },
        ]
      : [];
  });
  protected readonly rows = computed<SummaryRow[]>(() => {
    const data = this.state().data;
    return data
      ? [
          {
            id: 'purchases',
            label: this.i18n.instant('instruments.purchases'),
            value: data.purchases,
            detail: '',
            icon: 'down',
          },
          {
            id: 'sales',
            label: this.i18n.instant('instruments.sales'),
            value: data.sales,
            detail: '',
            icon: 'up',
          },
          {
            id: 'dividends',
            label: this.i18n.instant('instruments.dividends'),
            value: data.dividends,
            detail: '',
            icon: 'chart',
          },
        ]
      : [];
  });
}
