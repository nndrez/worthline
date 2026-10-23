import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiError } from '../../core/errors/api-errors';
import { ResultState } from './result-state';

@Component({
  selector: 'app-error-state',
  imports: [ResultState, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-result-state
    kind="error"
    [title]="compact() ? 'common.unavailable' : 'common.loadError'"
    icon="info"
    [message]="compact() ? '' : error().message"
    [reference]="compact() ? undefined : error().requestId"
    [compact]="compact()"
  >
    @if (retryable()) {
      <button type="button" class="btn btn-secondary btn-sm" (click)="retry.emit()">
        {{ 'common.retry' | translate }}
      </button>
    }
  </app-result-state>`,
  styles: ':host{display:flex;align-items:center;justify-content:center;min-width:0;width:100%}',
})
export class ErrorState {
  readonly error = input.required<UiError>();
  readonly compact = input(false);
  readonly retryable = input(true);
  readonly retry = output<void>();
}
