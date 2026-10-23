import { Component, input } from '@angular/core';
import { ResultState } from './result-state';
@Component({
  selector: 'app-empty-state',
  imports: [ResultState],
  host: { '[attr.title]': 'null' },
  template: `<app-result-state
    [title]="title()"
    [description]="description()"
    [icon]="icon()"
    [compact]="compact()"
    ><ng-content
  /></app-result-state>`,
  styles: ':host{display:block;width:100%}',
})
export class EmptyState {
  readonly title = input('common.empty');
  readonly description = input('');
  readonly icon = input('wallet');
  readonly compact = input(false);
}
