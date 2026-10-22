import { UiOptions } from '../../shared/ui/controls/select-options';
import { UiInput } from '../../shared/ui/controls/input';
import { UiDatepicker } from '../../shared/ui/controls/datepicker';
import { UiSelect } from '../../shared/ui/controls/select';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { WealthApi } from './wealth-api';
import { Account, BalanceRequest, MonthlyBalance } from './wealth.models';
import { MutationState } from '../../core/http/mutation-state';
import { ApiErrors, loadState, loading } from '../../core/errors/api-errors';
import { DialogFrame } from '../../shared/ui/dialog-frame';
import { Notice } from '../../shared/ui/notice';
import { FieldError } from '../../shared/ui/field-error';
import { decimalInput } from '../../shared/utils/money';
import { currentMonth, monthEnd } from '../../shared/utils/dates';

@Component({
  selector: 'app-balance-editor',
  imports: [
    UiSelect,
    UiDatepicker,
    UiInput,
    UiOptions,
    TranslatePipe,
    DialogFrame,
    FormField,
    Notice,
    FieldError,
  ],
  providers: [MutationState],
  templateUrl: './balance-editor.html',
})
export class BalanceEditor {
  private readonly api = inject(WealthApi);
  private readonly errors = inject(ApiErrors);
  readonly initial = input<MonthlyBalance | null>(null);
  readonly month = input(currentMonth());
  readonly accountId = input('');
  readonly saved = output<void>();
  readonly closed = output<void>();
  protected readonly mutation = inject(MutationState);
  protected readonly attempted = signal(false);
  protected readonly localError = signal('');
  protected readonly model = signal({ accountId: '', date: monthEnd(currentMonth()), amount: '' });
  protected readonly entry = form(this.model, (path) => {
    required(path.accountId);
    required(path.date);
    required(path.amount);
  });
  protected readonly options = toSignal(loadState(this.api.accountOptions(), this.errors), {
    initialValue: loading<Account[]>(),
  });
  protected readonly choices = computed(() => this.options().data || []);

  constructor() {
    effect(() => {
      const value = this.initial();
      this.model.set(
        value
          ? { accountId: value.accountId, date: value.date, amount: String(value.amount) }
          : { accountId: this.accountId(), date: monthEnd(this.month()), amount: '' },
      );
    });
  }

  protected save(event: Event): void {
    event.preventDefault();
    this.attempted.set(true);
    this.localError.set('');
    if (this.entry().invalid() || this.mutation.busy()) return;
    if (this.options().loading || this.options().error) return;
    const value = this.model();
    const amount = decimalInput(value.amount);
    if (amount === null) {
      this.localError.set('common.invalidMoney');
      return;
    }
    const body: BalanceRequest = { accountId: value.accountId, date: value.date, amount: amount! };
    this.mutation.run(this.api.saveMonthlyBalance(this.initial()?.id || null, body), () =>
      this.saved.emit(),
    );
  }
}
