import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DialogFrame } from './dialog-frame';
import { Notice } from './notice';
import { UiError } from '../../core/errors/api-errors';
@Component({
  selector: 'app-confirmation',
  imports: [TranslatePipe, DialogFrame, Notice],
  template: ` <app-dialog-frame
    heading="common.deleteTitle"
    [busy]="busy()"
    (closed)="cancelled.emit()"
  >
    <p class="text-sm leading-7 text-muted">
      {{ 'common.deleteDescription' | translate: { name: name() } }}
    </p>
    <app-notice [error]="error()" />
    <div class="dialog-actions">
      <button class="btn btn-secondary" [disabled]="busy()" (click)="cancelled.emit()">
        {{ 'common.cancel' | translate }}
      </button>
      <button class="btn btn-danger" [disabled]="busy()" (click)="confirm.emit()">
        {{ (busy() ? 'common.deleting' : 'common.delete') | translate }}
      </button>
    </div>
  </app-dialog-frame>`,
})
export class Confirmation {
  readonly name = input.required<string>();
  readonly busy = input(false);
  readonly error = input<UiError | null>(null);
  readonly cancelled = output<void>();
  readonly confirm = output<void>();
}
