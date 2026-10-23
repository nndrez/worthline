import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { UI_I18N } from './controls/foundation';
const SIZES = { xs: 'size-3', sm: 'size-4', md: 'size-8', lg: 'size-12' };
/** Insula's circular spinner, using Worthline's neutral tokens. */
@Component({
  selector: 'ui-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex shrink-0',
    '[attr.role]': 'decorative() ? null : "status"',
    '[attr.aria-label]': 'decorative() ? null : (label() ?? i18n().loading)',
    '[attr.aria-hidden]': 'decorative() || null',
  },
  template: '<span [class]="classes()"></span>',
})
export class UiSpinner {
  readonly size = input<keyof typeof SIZES>('md');
  readonly label = input<string>();
  readonly decorative = input(false, { transform: booleanAttribute });
  protected readonly i18n = inject(UI_I18N);
  protected readonly classes = computed(
    () =>
      `${SIZES[this.size()]} animate-spin rounded-full border-2 border-spinner-track border-t-spinner`,
  );
}
