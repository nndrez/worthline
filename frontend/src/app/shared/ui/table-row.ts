import { Directive, output } from '@angular/core';
/** Preserve native table semantics and independent buttons inside an actionable row. */
@Directive({
  selector: 'tr[appTableRow]',
  host: {
    tabindex: '0',
    class: 'interactive-row',
    '(click)': 'activate($event)',
    '(keydown)': 'onKey($event)',
  },
})
export class TableRow {
  readonly rowActivated = output<void>();
  protected activate(event: Event): void {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('button, a, input, select, textarea, [contenteditable]')
    )
      return;
    if (window.getSelection()?.toString()) return;
    this.rowActivated.emit();
  }
  protected onKey(event: KeyboardEvent): void {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.rowActivated.emit();
    }
  }
}
