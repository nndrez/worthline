import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PageMetadata, pageIndex } from '../../core/http/page';
import { Icon } from './icon';
@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe, Icon],
  template: ` @if (page(); as meta) {
    <nav
      class="pagination"
      [class.is-compact]="compact()"
      [attr.aria-label]="'common.pagination' | translate"
    >
      <span>{{
        (meta.totalElements === 1 ? 'common.result' : 'common.results')
          | translate: { count: meta.totalElements }
      }}</span>
      <div class="flex items-center gap-3">
        <span>{{
          'common.page' | translate: { current: meta.currentPage, total: meta.totalPages || 1 }
        }}</span>
        <button
          class="icon-button"
          [disabled]="disabled() || meta.first"
          [attr.aria-label]="'common.previous' | translate"
          (click)="pageChange.emit(index(meta) - 1)"
        >
          <app-icon name="left" />
        </button>
        <button
          class="icon-button"
          [disabled]="disabled() || meta.last"
          [attr.aria-label]="'common.next' | translate"
          (click)="pageChange.emit(index(meta) + 1)"
        >
          <app-icon name="right" />
        </button>
      </div>
    </nav>
  }`,
  styles:
    '.pagination.is-compact{padding:8px 16px;font-size:10px}.pagination.is-compact .icon-button{width:28px;height:28px;font-size:13px}.pagination{padding:18px 24px;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:12px;color:var(--muted)}@media(max-width:500px){.pagination{padding:16px;flex-wrap:wrap}}',
})
export class Pagination {
  readonly page = input<PageMetadata | null>(null);
  readonly disabled = input(false);
  readonly compact = input(false);
  readonly pageChange = output<number>();
  protected readonly index = pageIndex;
}
