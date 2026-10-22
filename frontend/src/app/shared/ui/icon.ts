import { Component, input } from '@angular/core';
const paths: Record<string, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  wallet: 'M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6m18 6h-5v5h5m-2-2.5h.01',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  down: 'm7 10 5 5 5-5',
  up: 'm7 14 5-5 5 5',
  left: 'm14 6-6 6 6 6',
  right: 'm10 6 6 6-6 6',
  search: 'm21 21-5-5m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  chart: 'M4 3v17h17M7 14l4-4 4 3 6-8',
  bank: 'm3 8 9-5 9 5H3zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18',
  swap: 'M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4',
  tag: 'M20 13 11 22 2 13V3h10l8 8v2zM7 7h.01',
  calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z',
  edit: 'm15 4 5 5M4 20l4-1L21 6a2.8 2.8 0 0 0-4-4L4 15v5z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  check: 'm5 12 4 4L19 6',
  info: 'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  trend: 'm3 17 6-6 4 4 8-10m-6 0h6v6',
  leaf: 'M20 4C8 2 3 7 4 14c1 6 10 8 14 1 2-4 2-7 2-11zM5 20 15 10',
};
@Component({
  selector: 'app-icon',
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path()" /></svg>',
  styles:
    ':host{display:inline-flex;width:1.2em;height:1.2em;flex-shrink:0}svg{width:100%;height:100%}',
})
export class Icon {
  readonly name = input('grid');
  protected path(): string {
    return paths[this.name()] || paths['grid'];
  }
}
