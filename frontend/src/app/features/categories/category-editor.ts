import { UiOptions } from '../../shared/ui/controls/select-options';
import { UiInput } from '../../shared/ui/controls/input';
import { UiSelect } from '../../shared/ui/controls/select';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { CategoriesApi } from './categories-api';
import { Category, CategoryRequest, CategoryType } from './categories.models';
import { MutationState } from '../../core/http/mutation-state';
import { ApiErrors, loadState, loading } from '../../core/errors/api-errors';
import { DialogFrame } from '../../shared/ui/dialog-frame';
import { Notice } from '../../shared/ui/notice';
import { FieldError } from '../../shared/ui/field-error';

@Component({
  selector: 'app-category-editor',
  imports: [
    UiSelect,
    UiInput,
    UiOptions,
    TranslatePipe,
    DialogFrame,
    FormField,
    Notice,
    FieldError,
  ],
  providers: [MutationState],
  templateUrl: './category-editor.html',
})
export class CategoryEditor {
  private readonly api = inject(CategoriesApi);
  private readonly errors = inject(ApiErrors);
  readonly initial = input<Category | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();
  protected readonly mutation = inject(MutationState);
  protected readonly attempted = signal(false);
  protected readonly model = signal({ name: '', type: 'EXPENSE' as CategoryType, parentId: '' });
  protected readonly entry = form(this.model, (path) => {
    required(path.name);
    required(path.type);
    maxLength(path.name, 100);
  });
  protected readonly options = toSignal(loadState(this.api.rootOptions(), this.errors), {
    initialValue: loading<Category[]>(),
  });
  protected readonly choices = computed(() =>
    (this.options().data || []).filter((option) => option.type === this.model().type),
  );

  constructor() {
    effect(() => {
      const value = this.initial();
      this.model.set(
        value
          ? { name: value.name, type: value.type, parentId: value.parentId || '' }
          : { name: '', type: 'EXPENSE' as CategoryType, parentId: '' },
      );
    });
  }

  protected parentName(): string {
    return this.choices().find((option) => option.id === this.model().parentId)?.name || '';
  }

  protected save(event: Event): void {
    event.preventDefault();
    this.attempted.set(true);
    if (this.entry().invalid() || this.mutation.busy()) return;
    if (this.options().loading || this.options().error) return;
    const value = this.model();
    const body: CategoryRequest = {
      name: value.name.trim(),
      type: value.type,
      parentId: value.parentId || null,
    };
    this.mutation.run(this.api.saveCategory(this.initial()?.id || null, body), () =>
      this.saved.emit(),
    );
  }
}
