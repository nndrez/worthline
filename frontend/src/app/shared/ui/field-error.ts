import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'app-field-error',
  imports: [TranslatePipe],
  template: '@if (visible()) { <span class="field-error">{{ message() | translate }}</span> }',
  styles:
    '.field-error{display:block;color:var(--danger);font-size:12px;margin-top:6px;line-height:1.5}',
})
export class FieldError {
  readonly visible = input(false);
  readonly message = input('common.fieldError');
}
