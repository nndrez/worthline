import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { UiError } from '../../core/errors/api-errors';
import { Icon } from './icon';
@Component({
  selector: 'app-notice',
  imports: [TranslatePipe, Icon],
  template: ` @if (error(); as failure) {
    <div class="notice" role="alert">
      <app-icon name="info" />
      <div class="flex-1">
        <p>{{ failure.message }}</p>
        @if (failure.fields.length) {
          <p class="text-sm mt-1">
            {{ 'common.checkFields' | translate }}: {{ failure.fields.join(', ') }}
          </p>
        }
        @if (failure.requestId) {
          <p class="text-xs mt-1">{{ 'common.reference' | translate }}: {{ failure.requestId }}</p>
        }
      </div>
      @if (retryable()) {
        <button class="btn btn-secondary btn-sm" (click)="retry.emit()">
          {{ 'common.retry' | translate }}
        </button>
      }
    </div>
  }`,
  styles:
    ':host{display:block}.notice{display:flex;gap:12px;align-items:center;padding:16px 20px;border:1px solid var(--warning-border);border-radius:var(--radius);background:var(--warning-bg);color:var(--warning-text);font-size:14px}',
})
export class Notice {
  readonly error = input<UiError | null>(null);
  readonly retryable = input(false);
  readonly retry = output<void>();
}
