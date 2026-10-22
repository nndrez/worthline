import { UiInput } from '../../shared/ui/controls/input';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { form, FormField, maxLength, pattern, required } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { PortfolioApi } from './portfolio-api';
import { Instrument, InstrumentRequest } from './portfolio.models';
import { MutationState } from '../../core/http/mutation-state';

import { DialogFrame } from '../../shared/ui/dialog-frame';
import { Notice } from '../../shared/ui/notice';
import { FieldError } from '../../shared/ui/field-error';

@Component({
  selector: 'app-instrument-editor',
  imports: [UiInput, TranslatePipe, DialogFrame, FormField, Notice, FieldError],
  providers: [MutationState],
  templateUrl: './instrument-editor.html',
})
export class InstrumentEditor {
  private readonly api = inject(PortfolioApi);
  readonly initial = input<Instrument | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();
  protected readonly mutation = inject(MutationState);
  protected readonly attempted = signal(false);
  protected readonly model = signal({ code: '', name: '', isin: '', ticker: '' });
  protected readonly entry = form(this.model, (path) => {
    required(path.name);
    required(path.code);
    maxLength(path.name, 255);
    maxLength(path.ticker, 32);
    maxLength(path.code, 32);
    maxLength(path.isin, 12);
    pattern(path.code, /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,31}$/);
    pattern(path.isin, /^$|^[a-zA-Z]{2}[a-zA-Z0-9]{9}[0-9]$/);
  });

  constructor() {
    effect(() => {
      const value = this.initial();
      this.model.set(
        value
          ? {
              code: value.code,
              name: value.name,
              isin: value.isin || '',
              ticker: value.ticker || '',
            }
          : { code: '', name: '', isin: '', ticker: '' },
      );
    });
  }

  protected save(event: Event): void {
    event.preventDefault();
    this.attempted.set(true);
    if (this.entry().invalid() || this.mutation.busy()) return;
    const value = this.model();
    const body: InstrumentRequest = {
      code: value.code.trim().toUpperCase(),
      name: value.name.trim(),
      isin: value.isin.trim().toUpperCase() || null,
      ticker: value.ticker.trim() || null,
    };
    this.mutation.run(this.api.saveInstrument(this.initial()?.id || null, body), () =>
      this.saved.emit(),
    );
  }
}
