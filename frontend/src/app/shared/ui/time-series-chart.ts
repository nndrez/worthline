import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ChartViewport } from './chart-viewport';
import { ChartAnchor } from './tooltip-position';
import { ChartTooltip } from './chart-tooltip';
import { monthLabel } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { TimePoint, TimeSeries, timeSeriesModel } from './time-series-model';
let nextChart = 0;
@Component({
  selector: 'app-time-series-chart',
  imports: [ChartViewport, ChartTooltip, TranslatePipe],
  templateUrl: './time-series-chart.html',
  styleUrl: './time-series-chart.css',
})
export class TimeSeriesChart {
  protected readonly chartId = 'time-series-' + ++nextChart;
  readonly points = input.required<readonly TimePoint[]>();
  readonly series = input.required<readonly TimeSeries[]>();
  readonly label = input.required<string>();
  readonly month = input('');
  readonly highlightedMonth = input<string | null | undefined>(undefined);
  readonly monthHighlighted = output<string | null>();
  readonly compact = input(false);
  readonly monthSelected = output<string>();
  protected readonly hidden = signal<readonly string[]>([]);
  protected readonly selected = linkedSignal({
    source: this.points,
    computation: (): TimePoint | null => null,
  });
  protected readonly activePoint = computed(() => {
    const month = this.highlightedMonth();
    return month === undefined
      ? this.selected()
      : (this.points().find((point) => point.month === month) ?? null);
  });
  protected readonly activeMonth = computed(() => this.activePoint()?.month ?? this.month());
  protected clearHighlight(): void {
    this.selected.set(null);
    this.monthHighlighted.emit(null);
  }
  protected readonly visible = computed(() =>
    this.series().filter((line) => !this.hidden().includes(line.key)),
  );
  private readonly viewport = viewChild(ChartViewport);
  protected readonly graph = computed(() =>
    timeSeriesModel(
      this.points(),
      this.visible(),
      this.viewport()?.width() ?? 800,
      this.viewport()?.height() ?? 200,
      this.compact(),
    ),
  );
  private readonly plot = viewChild<ElementRef<SVGSVGElement>>('plot');
  private readonly hoverY = signal<number | null>(null);
  protected readonly tooltipAnchor = computed<ChartAnchor | null>(() => {
    const selected = this.activePoint();
    const graph = this.graph();
    const svg = this.plot()?.nativeElement;
    if (!selected || !graph || !svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const point = graph.points.find((point) => point.month === selected.month);
    if (!point) return null;
    const positions = point.dots.flatMap((dot) =>
      dot.y === null ? [] : [rect.top + (dot.y * rect.height) / graph.height],
    );
    const cursor = this.selected()?.month === selected.month ? this.hoverY() : null;
    const y =
      cursor === null
        ? (positions[0] ?? rect.top + graph.bottom)
        : positions.reduce(
            (best, y) => (Math.abs(y - cursor) < Math.abs(best - cursor) ? y : best),
            positions[0] ?? cursor,
          );
    return { x: rect.left + (point.x * rect.width) / graph.width, y };
  });
  constructor() {
    effect(() => {
      this.viewport()?.width();
      this.viewport()?.height();
      untracked(() => this.selected.set(null));
    });
  }
  protected select(point: TimePoint, event: Event): void {
    this.hoverY.set(event instanceof PointerEvent ? event.clientY : null);
    this.selected.set(point);
    this.monthHighlighted.emit(point.month);
  }
  protected readonly tooltipRows = computed(() =>
    this.visible().map((line) => ({
      label: line.label,
      value: this.activePoint()?.values[line.key] ?? null,
      color: line.color,
    })),
  );
  protected readonly monthLabel = monthLabel;
  protected readonly pointLabel = (point: TimePoint) =>
    monthLabel(point.month) +
    ': ' +
    this.visible()
      .map((line) => line.label + ' ' + formatMoney(point.values[line.key] ?? null))
      .join(', ');
  protected toggle(key: string): void {
    this.hidden.update((keys) =>
      keys.includes(key)
        ? keys.filter((value) => value !== key)
        : this.visible().length > 1
          ? [...keys, key]
          : keys,
    );
  }
  protected activate(point: TimePoint): void {
    this.selected.set(point);
    this.monthHighlighted.emit(point.month);
    this.monthSelected.emit(point.month);
  }
  protected move(event: Event, offset: number): void {
    event.preventDefault();
    const current = event.currentTarget as SVGElement;
    const buttons = Array.from(
      current.closest('svg')!.querySelectorAll<SVGElement>('.chart-point'),
    );
    buttons[(buttons.indexOf(current) + offset + buttons.length) % buttons.length]?.focus();
  }
}
