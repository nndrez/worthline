import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiSpinner } from './spinner';
@Component({
  selector: 'app-loading-state',
  imports: [UiSpinner, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full min-h-0 w-full items-center justify-center' },
  template: `<div
    [class]="
      compact()
        ? 'flex flex-col items-center p-2'
        : 'flex flex-col items-center gap-3 px-6 py-8 text-center'
    "
    role="status"
    aria-live="polite"
  >
    <ui-spinner decorative [size]="compact() ? 'sm' : 'md'" />
    <p class="text-xs text-muted" [class.sr-only]="compact()">{{ 'common.loading' | translate }}</p>
  </div>`,
})
export class LoadingState {
  readonly compact = input(false);
}
