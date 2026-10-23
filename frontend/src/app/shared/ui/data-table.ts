import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { LoadingState } from './loading-state';
import { PageMetadata } from '../../core/http/page';
import { UiError } from '../../core/errors/api-errors';
import { ErrorState } from './error-state';
import { Pagination } from './pagination';
import { UiMotion } from './motion';

@Component({
  selector: 'app-data-table',
  imports: [LoadingState, ErrorState, Pagination],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  // Scoped selectors style the semantic table projected by each feature.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-loading]': 'loading()',
    '[class.is-embedded]': '!contained()',
    '[class.is-compact]': 'density() === "compact"',
    '[class.is-fluid]': 'fill()',
    '[class.has-plain-header]': 'headerStyle() === "plain"',
    '[attr.aria-busy]': 'loading()',
  },
})
export class DataTable {
  readonly label = input.required<string>();
  readonly contentKey = input<unknown>(null);
  readonly loading = input(false);
  readonly error = input<UiError | null>(null);
  readonly page = input<PageMetadata | null>(null);
  readonly contained = input(true);
  readonly fill = input(false);
  readonly headerStyle = input<'subtle' | 'plain'>('subtle');
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  readonly pageChange = output<number>();
  readonly retry = output<void>();
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly motion = inject(UiMotion);

  constructor() {
    afterRenderEffect((onCleanup) => {
      // New results, including sort/filter changes, start at the first row.
      const contentKey = this.contentKey();
      const page = this.page();
      const error = this.error();
      if (!this.loading()) {
        const viewport = this.viewport()?.nativeElement;
        if (viewport) {
          if (contentKey || page || error) viewport.scrollTop = 0;
          onCleanup(this.motion.revealRows(viewport));
        }
      }
    });
  }
}
