import { Component, input } from '@angular/core';
export interface DetailField {
  label: string;
  value: string;
}
@Component({
  selector: 'app-detail-fields',
  template: `<dl>
    @for (field of fields(); track field.label) {
      <div>
        <dt>{{ field.label }}</dt>
        <dd>{{ field.value || '—' }}</dd>
      </div>
    }
  </dl>`,
  styles: `
    dl {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
      margin: 0;
      padding: 20px;
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    dt {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 6px;
    }
    dd {
      font-size: 14px;
      margin: 0;
      overflow-wrap: anywhere;
    }
    @media (max-width: 500px) {
      dl {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DetailFields {
  readonly fields = input.required<readonly DetailField[]>();
}
