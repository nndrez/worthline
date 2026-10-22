import { UiOptions } from '../../shared/ui/controls/select-options';
import { UiInput } from '../../shared/ui/controls/input';
import { UiDatepicker } from '../../shared/ui/controls/datepicker';
import { UiSelect } from '../../shared/ui/controls/select';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import Decimal from 'decimal.js';
import { PortfolioApi } from './portfolio-api';
import { Instrument, Operation, OperationRequest, OperationType } from './portfolio.models';
import { MutationState } from '../../core/http/mutation-state';
import { ApiErrors, loadState, loading } from '../../core/errors/api-errors';
import { DialogFrame } from '../../shared/ui/dialog-frame';
import { Notice } from '../../shared/ui/notice';
import { FieldError } from '../../shared/ui/field-error';
import { decimalInput } from '../../shared/utils/money';
import { today } from '../../shared/utils/dates';

@Component({
  selector: 'app-operation-editor',
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
  templateUrl: './operation-editor.html',
})
export class OperationEditor {
  private readonly api = inject(PortfolioApi);
  private readonly errors = inject(ApiErrors);
  readonly initial = input<Operation | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();
  protected readonly mutation = inject(MutationState);
  protected readonly attempted = signal(false);
  protected readonly localError = signal('');
  protected readonly model = signal({
    instrumentId: '',
    date: today(),
    type: 'BUY' as OperationType,
    market: '',
    broker: '',
    unitPrice: '',
    quantity: '',
    amount: '',
    notes: '',
  });
  protected readonly entry = form(this.model, (path) => {
    required(path.instrumentId);
    required(path.date);
    required(path.type);
    required(path.amount);
    maxLength(path.broker, 100);
    maxLength(path.market, 100);
    maxLength(path.notes, 2000);
  });
  protected readonly options = toSignal(loadState(this.api.instrumentOptions(), this.errors), {
    initialValue: loading<Instrument[]>(),
  });
  protected readonly choices = computed(() => this.options().data || []);

  constructor() {
    effect(() => {
      const value = this.initial();
      this.model.set(
        value
          ? {
              instrumentId: value.instrumentId,
              date: value.date,
              type: value.type,
              market: value.market || '',
              broker: value.broker || '',
              unitPrice: value.unitPrice === null ? '' : String(value.unitPrice),
              quantity: value.quantity === null ? '' : String(value.quantity),
              amount: String(value.amount),
              notes: value.notes || '',
            }
          : {
              instrumentId: '',
              date: today(),
              type: 'BUY' as OperationType,
              market: '',
              broker: '',
              unitPrice: '',
              quantity: '',
              amount: '',
              notes: '',
            },
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
    if (amount === null || new Decimal(amount).lte(0)) {
      this.localError.set('common.invalidMoney');
      return;
    }
    const unitPrice = decimalInput(value.unitPrice, 6);
    const quantity = decimalInput(value.quantity, 6);
    if (
      value.type !== 'DIVIDEND' &&
      (!unitPrice || !quantity || new Decimal(unitPrice).lte(0) || new Decimal(quantity).lte(0))
    ) {
      this.localError.set('common.invalidTrade');
      return;
    }
    const body: OperationRequest = {
      ...value,
      market: value.market.trim() || null,
      broker: value.broker.trim() || null,
      unitPrice: value.type === 'DIVIDEND' ? null : unitPrice,
      quantity: value.type === 'DIVIDEND' ? null : quantity,
      amount: amount!,
      notes: value.notes.trim() || null,
    };
    this.mutation.run(this.api.saveOperation(this.initial()?.id || null, body), () =>
      this.saved.emit(),
    );
  }
}
