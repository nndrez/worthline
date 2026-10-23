import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';

/** Gives SVG charts a viewBox matching their available width, including on mobile. */
@Component({
  selector: 'app-chart-viewport',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styles: ':host{position:relative;display:block;min-width:0;width:100%}',
})
export class ChartViewport implements OnDestroy {
  readonly width = signal(800);
  readonly height = signal(235);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: ResizeObserver;
  constructor() {
    afterNextRender(() => {
      this.observer = new ResizeObserver(([entry]) => {
        this.width.set(Math.max(200, Math.round(entry.contentRect.width)));
        this.height.set(Math.max(80, Math.round(entry.contentRect.height)));
      });
      this.observer.observe(this.element.nativeElement);
    });
  }
  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
