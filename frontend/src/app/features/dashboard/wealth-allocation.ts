import { RouterLink } from '@angular/router';
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Card } from '../../shared/ui/card';
import { ChartAnchor } from '../../shared/ui/tooltip-position';
import { ChartTooltip } from '../../shared/ui/chart-tooltip';
import { MoneyPipe } from '../../shared/utils/money-pipe';
import { DashboardApi, AllocationGroup } from './dashboard-api';
import { cardResource } from './card-resource';
@Component({
  selector: 'app-wealth-allocation',
  imports: [RouterLink, Card, ChartTooltip, TranslatePipe, MoneyPipe, DecimalPipe],
  templateUrl: './wealth-allocation.html',
  styleUrl: './wealth-allocation.css',
})
export class WealthAllocation {
  readonly month = input.required<string>();
  private readonly api = inject(DashboardApi);
  protected readonly resource = cardResource(() => this.api.allocation(this.month()));
  protected readonly selected = linkedSignal({
    source: this.resource.state,
    computation: (): AllocationGroup | null => null,
  });
  private readonly donut = viewChild<ElementRef<HTMLElement>>('donut');
  protected readonly anchor = signal<ChartAnchor | null>(null);
  protected select(group: AllocationGroup, event: Event): void {
    const point = this.groups().find((point) => point.type === group.type)!;
    const box = this.donut()?.nativeElement.getBoundingClientRect();
    if (box) {
      const angle = ((-point.offset + point.fraction / 2) / 100) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(box.width, box.height) * 0.385;
      this.anchor.set({
        x: box.left + box.width / 2 + Math.cos(angle) * radius,
        y: box.top + box.height / 2 + Math.sin(angle) * radius,
      });
    } else if (event instanceof PointerEvent)
      this.anchor.set({ x: event.clientX, y: event.clientY });
    this.selected.set(group);
  }
  protected readonly groups = computed(() => {
    let offset = 0;
    return (this.resource.state().data?.groups ?? []).map((group) => {
      const fraction = Number(group.percentage);
      const start = offset;
      offset += fraction;
      return {
        ...group,
        fraction,
        offset: -start,
        dash: `${fraction} ${100 - fraction}`,
        color: `var(--chart-${group.type.toLowerCase()})`,
      };
    });
  });
}
