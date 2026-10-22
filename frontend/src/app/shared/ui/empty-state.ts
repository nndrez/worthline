import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from './icon';
@Component({
  selector: 'app-empty-state',
  imports: [TranslatePipe, Icon],
  template: ` <div class="empty-state">
    <span class="empty-icon"><app-icon [name]="icon()" /></span>
    <h3>{{ title() | translate }}</h3>
    <p>{{ description() | translate }}</p>
    <ng-content />
  </div>`,
  styles:
    '.empty-state{text-align:center;padding:52px 24px}.empty-icon{display:inline-flex;padding:16px;background:var(--surface-alt);border:1px solid var(--border);border-radius:18px;font-size:24px;margin-bottom:20px;color:var(--muted)}h3{font-size:16px;font-weight:600}p{color:var(--muted);font-size:14px;max-width:380px;margin:8px auto 20px;line-height:1.7}',
})
export class EmptyState {
  readonly title = input('common.empty');
  readonly description = input('common.emptyDescription');
  readonly icon = input('wallet');
}
