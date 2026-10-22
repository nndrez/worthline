import { Directive, ElementRef, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { UI_FIELD_CLASSES, UI_FORM_FIELD } from './foundation';

@Directive({
  selector: 'input[uiInput], textarea[uiInput]',
  host: {
    '[class]': 'classes',
    '[attr.id]': 'field?.controlId() ?? id() ?? null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'isInvalid() || null',
  },
})
export class UiInput {
  readonly id = input<string>();

  protected readonly field = inject(UI_FORM_FIELD, { optional: true });
  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly isTextarea =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'TEXTAREA';

  protected readonly classes = this.isTextarea
    ? `${UI_FIELD_CLASSES} min-h-24 resize-y`
    : UI_FIELD_CLASSES;

  isInvalid(): boolean {
    if (this.field?.invalid()) return true;
    const control = this.ngControl;
    return !!control?.invalid && !!(control.touched || control.dirty);
  }
}
