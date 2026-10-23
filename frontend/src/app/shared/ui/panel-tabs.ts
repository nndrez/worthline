import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface PanelTab {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-panel-tabs',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-tabs.html',
  styleUrl: './panel-tabs.css',
})
export class PanelTabs {
  readonly items = input.required<readonly PanelTab[]>();
  readonly value = model.required<string>();
  readonly prefix = input.required<string>();
  readonly label = input('common.sections');
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  protected navigate(event: KeyboardEvent): void {
    const items = this.items();
    const current = items.findIndex((item) => item.value === this.value());
    if (!items.length) return;
    let next: number;
    if (event.key === 'ArrowRight') next = (current + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    this.value.set(items[next].value);
    this.element.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }
}
