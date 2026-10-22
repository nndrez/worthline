import {
  afterNextRender,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from './icon';
let nextDialog = 0;
@Component({
  selector: 'app-dialog-frame',
  imports: [TranslatePipe, Icon],
  template: ` <dialog #modal [attr.aria-labelledby]="headingId" (cancel)="cancel($event)">
    <div class="dialog-content">
      <header>
        <div>
          <span class="eyebrow">{{ 'app.name' | translate }}</span>
          <h2 [id]="headingId">{{ heading() | translate }}</h2>
          @if (description()) {
            <p>{{ description() | translate }}</p>
          }
        </div>
        <button
          class="icon-button"
          type="button"
          [disabled]="busy()"
          [attr.aria-label]="'common.close' | translate"
          (click)="close()"
        >
          <app-icon name="close" />
        </button>
      </header>
      <ng-content />
    </div>
  </dialog>`,
  styleUrl: './dialog-frame.css',
})
export class DialogFrame implements OnDestroy {
  readonly heading = input.required<string>();
  readonly description = input('');
  readonly busy = input(false);
  readonly closed = output<void>();
  protected readonly headingId = `dialog-heading-${++nextDialog}`;
  private readonly modal = viewChild.required<ElementRef<HTMLDialogElement>>('modal');
  constructor() {
    afterNextRender(() => {
      const dialog = this.modal().nativeElement;
      dialog.showModal();
      dialog.querySelector<HTMLElement>('input:not([readonly]), select, textarea')?.focus();
    });
  }
  protected cancel(event: Event): void {
    event.preventDefault();
    this.close();
  }
  close(): void {
    if (!this.busy()) {
      this.modal().nativeElement.close();
      this.closed.emit();
    }
  }
  ngOnDestroy(): void {
    this.modal().nativeElement.close();
  }
}
