import { UiOptions } from '../../shared/ui/controls/select-options';
import { UiInput } from '../../shared/ui/controls/input';
import { UiDatepicker } from '../../shared/ui/controls/datepicker';
import { UiSelect } from '../../shared/ui/controls/select';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import Decimal from 'decimal.js';
import { TransactionsApi } from './transactions-api';
import {
  CategoryOption,
  Transaction,
  TransactionRequest,
  TransactionType,
} from './transactions.models';
import { MutationState } from '../../core/http/mutation-state';
import { ApiErrors, loadState, loading } from '../../core/errors/api-errors';
import { DialogFrame } from '../../shared/ui/dialog-frame';
import { Notice } from '../../shared/ui/notice';
import { FieldError } from '../../shared/ui/field-error';
import { decimalInput } from '../../shared/utils/money';
import { today } from '../../shared/utils/dates';

@Component({
  selector: 'app-transaction-editor',
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
  templateUrl: './transaction-editor.html',
})
export class TransactionEditor {
  private readonly api = inject(TransactionsApi);
  private readonly errors = inject(ApiErrors);
  readonly initial = input<Transaction | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();
  protected readonly mutation = inject(MutationState);
  protected readonly attempted = signal(false);
  protected readonly localError = signal('');
  protected readonly model = signal({
    date: today(),
    type: 'EXPENSE' as TransactionType,
    description: '',
    amount: '',
    categoryId: '',
    tag: '',
    notes: '',
  });
  protected readonly entry = form(this.model, (path) => {
    required(path.type);
    required(path.date);
    required(path.description);
    required(path.amount);
    required(path.categoryId);
    maxLength(path.description, 255);
    maxLength(path.tag, 100);
    maxLength(path.notes, 2000);
  });
  protected readonly options = toSignal(loadState(this.api.categoryOptions(), this.errors), {
    initialValue: loading<CategoryOption[]>(),
  });
  protected readonly choices = computed(() =>
    (this.options().data || []).filter((option) => option.type === this.model().type),
  );

  constructor() {
    effect(() => {
      const value = this.initial();
      this.model.set(
        value
          ? {
              date: value.date,
              type: value.type,
              description: value.description,
              amount: String(value.amount),
              categoryId: value.categoryId,
              tag: value.tag || '',
              notes: value.notes || '',
            }
          : {
              date: today(),
              type: 'EXPENSE' as TransactionType,
              description: '',
              amount: '',
              categoryId: '',
              tag: '',
              notes: '',
            },
      );
    });
  }

  protected categoryLabel(option: CategoryOption): string {
    const parent = this.options().data?.find((item) => item.id === option.parentId);
    return parent ? `${parent.name} / ${option.name}` : option.name;
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
    const body: TransactionRequest = {
      ...value,
      description: value.description.trim(),
      amount: amount!,
      tag: value.tag.trim() || null,
      notes: value.notes.trim() || null,
    };
    this.mutation.run(this.api.saveTransaction(this.initial()?.id || null, body), () =>
      this.saved.emit(),
    );
  }
}
