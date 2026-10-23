import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Icon } from './icon';

/** Insula-style centered feedback shared by empty and failed content areas. */
@Component({
  selector: 'app-result-state',
  imports: [TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.compact]': 'compact()', '[attr.role]': 'kind() === "error" ? "alert" : null' },
  templateUrl: './result-state.html',
  styleUrl: './result-state.css',
})
export class ResultState {
  readonly kind = input<'empty' | 'error'>('empty');
  readonly title = input('common.empty');
  readonly description = input('');
  readonly message = input('');
  readonly reference = input<string>();
  readonly icon = input('wallet');
  readonly compact = input(false);
}
