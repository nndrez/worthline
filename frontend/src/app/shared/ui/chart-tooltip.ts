import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { MoneyPipe } from '../utils/money-pipe';
import { ChartAnchor, tooltipPosition } from './tooltip-position';
import { DecimalValue } from '../utils/money';

@Component({
  selector: 'app-chart-tooltip',
  imports: [MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-popover-panel', role: 'status', 'aria-live': 'polite', popover: 'manual' },
  template: `<span>{{ label() }}</span>
    @if (rows().length) {
      @for (row of rows(); track row.label) {
        <div class="tooltip-row">
          <i [style.background]="row.color"></i><span>{{ row.label }}</span
          ><strong>{{ row.value | money }}</strong>
        </div>
      }
    } @else {
      <strong>{{ value() | money }}</strong>
    }
    @if (detail()) {
      <small>{{ detail() }}</small>
    }`,
  styles: `
    :host {
      position: fixed;
      inset: auto;
      margin: 0;
      width: max-content;
      z-index: 3;
      display: none;
      flex-direction: column;
      gap: 3px;
      max-width: min(280px, calc(100vw - 16px));
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
      pointer-events: none;
      font-size: 11px;
    }
    :host(:popover-open) {
      display: flex;
    }
    .tooltip-row {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .tooltip-row i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .tooltip-row strong {
      margin-left: auto;
      font-size: 12px;
    }
    span,
    small {
      color: var(--muted);
    }
    strong {
      font-size: 14px;
      font-weight: 550;
    }
  `,
})
export class ChartTooltip implements OnDestroy {
  readonly anchor = input<ChartAnchor | null>(null);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    afterRenderEffect(() => {
      const anchor = this.anchor();
      this.label();
      this.value();
      this.detail();
      this.rows();
      const element = this.element.nativeElement;
      if (!element.matches(':popover-open')) element.showPopover();
      const parent = element.parentElement!.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      const position = tooltipPosition(
        anchor ?? { x: parent.right - 8, y: parent.top + 8 },
        bounds,
        { width: window.innerWidth, height: window.innerHeight },
      );
      element.style.left = position.left + 'px';
      element.style.top = position.top + 'px';
    });
  }
  ngOnDestroy(): void {
    if (this.element.nativeElement.matches(':popover-open'))
      this.element.nativeElement.hidePopover();
  }
  readonly label = input.required<string>();
  readonly value = input<DecimalValue | null>(null);
  readonly detail = input('');
  readonly rows = input<readonly { label: string; value: DecimalValue | null; color: string }[]>(
    [],
  );
}
