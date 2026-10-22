import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface TabItem {
  readonly path: string;
  readonly label: string;
}

@Component({
  selector: 'app-tabs',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<nav [attr.aria-label]="label() | translate">
    @for (item of items(); track item.path) {
      <a
        [routerLink]="item.path"
        routerLinkActive="selected-tab"
        [routerLinkActiveOptions]="matchOptions"
        ariaCurrentWhenActive="page"
        >{{ item.label | translate }}</a
      >
    }
  </nav>`,
  styleUrl: './tabs.css',
})
export class Tabs {
  protected readonly matchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  } as const;
  readonly items = input.required<readonly TabItem[]>();
  readonly label = input('common.sections');
}
