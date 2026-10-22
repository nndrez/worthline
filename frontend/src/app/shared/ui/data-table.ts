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
import { TranslatePipe } from '@ngx-translate/core';
import { PageMetadata } from '../../core/http/page';
import { UiError } from '../../core/errors/api-errors';
import { Notice } from './notice';
import { Pagination } from './pagination';
import { UiMotion } from './motion';

@Component({
  selector: 'app-data-table',
  imports: [TranslatePipe, Notice, Pagination],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  // Scoped selectors style the semantic table projected by each feature.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-loading]': 'loading()',
    '[class.is-embedded]': '!contained()',
    '[attr.aria-busy]': 'loading()',
  },
})
export class DataTable {
  readonly label = input.required<string>();
  readonly loading = input(false);
  readonly error = input<UiError | null>(null);
  readonly page = input<PageMetadata | null>(null);
  readonly columns = input(4);
  readonly contained = input(true);
  readonly pageChange = output<number>();
  readonly retry = output<void>();
  protected readonly skeletonRows = Array.from({ length: 7 }, (_, index) => index);
  protected readonly skeletonCells = Array.from({ length: 8 }, (_, index) => index);
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly motion = inject(UiMotion);

  constructor() {
    afterRenderEffect((onCleanup) => {
      // New results, including sort/filter changes, start at the first row.
      const page = this.page();
      const error = this.error();
      if (!this.loading()) {
        const viewport = this.viewport()?.nativeElement;
        if (viewport) {
          if (page || error) viewport.scrollTop = 0;
          onCleanup(this.motion.revealRows(viewport));
        }
      }
    });
  }
}
