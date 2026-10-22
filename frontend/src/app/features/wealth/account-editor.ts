import { UiInput } from '../../shared/ui/controls/input';
import { UiSelect } from '../../shared/ui/controls/select';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { WealthApi } from './wealth-api';
import { Account, AccountRequest, AccountType } from './wealth.models';
import { MutationState } from '../../core/http/mutation-state';

import { DialogFrame } from '../../shared/ui/dialog-frame';
import { Notice } from '../../shared/ui/notice';
import { FieldError } from '../../shared/ui/field-error';

@Component({
  selector: 'app-account-editor',
  imports: [UiSelect, UiInput, TranslatePipe, DialogFrame, FormField, Notice, FieldError],
  providers: [MutationState],
  templateUrl: './account-editor.html',
})
export class AccountEditor {
  private readonly api = inject(WealthApi);
  readonly initial = input<Account | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();
  protected readonly mutation = inject(MutationState);
  protected readonly attempted = signal(false);
  protected readonly model = signal({ name: '', type: 'CASH' as AccountType });
  protected readonly entry = form(this.model, (path) => {
    required(path.name);
    required(path.type);
    maxLength(path.name, 100);
  });

  constructor() {
    effect(() => {
      const value = this.initial();
      this.model.set(
        value ? { name: value.name, type: value.type } : { name: '', type: 'CASH' as AccountType },
      );
    });
  }

  protected save(event: Event): void {
    event.preventDefault();
    this.attempted.set(true);
    if (this.entry().invalid() || this.mutation.busy()) return;
    const value = this.model();
    const body: AccountRequest = { name: value.name.trim(), type: value.type };
    this.mutation.run(this.api.saveAccount(this.initial()?.id || null, body), () =>
      this.saved.emit(),
    );
  }
}
