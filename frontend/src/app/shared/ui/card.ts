import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { UiError } from '../../core/errors/api-errors';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { EmptyState } from './empty-state';
@Component({
  selector: 'app-card',
  imports: [LoadingState, ErrorState, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'panel',
    role: 'region',
    '[attr.aria-busy]': 'loading()',
    '[attr.aria-label]': 'label()',
    '[class.is-compact]': 'compact()',
    '[class.is-fluid]': 'fill()',
    '[class.is-contained]': '!scrollable()',
  },
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card implements OnDestroy {
  readonly label = input.required<string>();
  readonly loading = input(false);
  readonly error = input<UiError | null>(null);
  readonly bodyHeight = input(160);
  readonly fill = input(false);
  readonly scrollable = input(true);
  readonly empty = input(false);
  readonly emptyTitle = input('common.empty');
  readonly emptyDescription = input('');
  readonly emptyIcon = input('wallet');
  readonly retry = output<void>();
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly measuredHeight = signal<number | null>(null);
  protected readonly compact = computed(() => (this.measuredHeight() ?? this.bodyHeight()) < 200);
  private observer?: ResizeObserver;
  constructor() {
    afterNextRender(() => {
      this.observer = new ResizeObserver(([entry]) =>
        this.measuredHeight.set(Math.round(entry.contentRect.height)),
      );
      this.observer.observe(this.body().nativeElement);
    });
  }
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
