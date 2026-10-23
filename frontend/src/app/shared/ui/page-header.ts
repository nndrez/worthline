import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-page-header',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page-heading', '[attr.title]': 'null' },
  template: '<h1>{{ title() | translate }}</h1><div class="page-actions"><ng-content /></div>',
  styles: `
    :host {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 27px;
      font-weight: 600;
      letter-spacing: -0.8px;
      line-height: 1.3;
      margin: 0;
    }
    .page-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .page-actions:empty {
      display: none;
    }
    @media (max-width: 740px) {
      :host {
        align-items: flex-start;
        flex-direction: column;
        margin-bottom: 12px;
        gap: 12px;
      }
      h1 {
        font-size: 24px;
      }
      .page-actions {
        width: 100%;
      }
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
}
