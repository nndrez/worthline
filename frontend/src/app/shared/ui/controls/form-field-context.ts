import { InjectionToken, Signal } from '@angular/core';

export interface UiFormFieldContext {
  controlId: Signal<string>;
  describedBy: Signal<string | null>;
  invalid: Signal<boolean>;
}

export const UI_FORM_FIELD = new InjectionToken<UiFormFieldContext>('UI_FORM_FIELD');
