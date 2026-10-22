import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  Signal,
} from '@angular/core';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { UI_I18N, UiI18n } from './foundation';

export type UiCalendarDayTone = 'low' | 'high' | null;

@Component({
  selector: 'ui-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block p-3', '[class.w-80]': 'dayCaption()', '[class.w-72]': '!dayCaption()' },
  template: `
    <div class="mb-2 flex items-center justify-between">
      <button
        type="button"
        class="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg"
        [attr.aria-label]="monthOnly() ? i18n().previousYear : i18n().previousMonth"
        (click)="shiftMonth(-1)"
      >
        <svg
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <span class="text-sm font-semibold capitalize" aria-live="polite">{{ title() }}</span>
      <button
        type="button"
        class="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg"
        [attr.aria-label]="monthOnly() ? i18n().nextYear : i18n().nextMonth"
        (click)="shiftMonth(1)"
      >
        <svg
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>

    @if (monthOnly()) {
      <div class="grid grid-cols-3 gap-2">
        @for (month of months(); track month.getTime()) {
          <button
            type="button"
            class="rounded-lg px-2 py-3 text-sm capitalize hover:bg-surface-muted disabled:opacity-35"
            [class.bg-brand]="isMonthSelected(month)"
            [class.text-on-brand]="isMonthSelected(month)"
            [attr.aria-label]="monthLabel(month)"
            [attr.aria-pressed]="isMonthSelected(month)"
            [attr.data-active]="isSameActiveMonth(month) || null"
            [attr.tabindex]="isSameActiveMonth(month) ? 0 : -1"
            [disabled]="isOutOfRange(month)"
            (click)="pick(month)"
            (keydown)="onMonthKeydown($event)"
          >
            {{ monthLabel(month, 'MMM') }}
          </button>
        }
      </div>
    } @else {
      <table role="grid" class="w-full border-collapse" [attr.aria-label]="title()">
        <thead>
          <tr>
            @for (day of weekdays(); track $index) {
              <th
                scope="col"
                class="pb-1 text-center text-xs font-medium text-fg-subtle capitalize"
                [attr.abbr]="day.long"
              >
                {{ day.short }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (week of weeks(); track $index) {
            <tr>
              @for (day of week; track day.getTime()) {
                <td
                  role="gridcell"
                  [attr.aria-selected]="isSelected(day)"
                  class="px-0 py-0.5 text-center"
                >
                  <div
                    class="flex items-center justify-center"
                    [class]="(dayCaption() ? 'h-10 ' : 'h-9 ') + bandClasses(day)"
                  >
                    <button
                      type="button"
                      [class]="dayClasses(day)"
                      [attr.tabindex]="isActive(day) ? 0 : -1"
                      [attr.data-active]="isActive(day) || null"
                      [attr.aria-current]="isToday(day) ? 'date' : null"
                      [attr.aria-label]="dayLabel(day)"
                      [disabled]="isOutOfRange(day)"
                      (pointerenter)="hovered.emit(day)"
                      (click)="pick(day)"
                      (keydown)="onKeydown($event)"
                    >
                      <span class="leading-none">{{ day.getDate() }}</span>
                      @if (caption(day); as price) {
                        <span [class]="captionClasses(day)">{{ price }}</span>
                      }
                    </button>
                  </div>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class UiCalendar {
  readonly monthOnly = input(false);
  readonly selected = input<Date | null>(null);
  readonly rangeStart = input<Date | null>(null);
  readonly rangeEnd = input<Date | null>(null);
  readonly rangePreview = input(false);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly dayCaption = input<((date: Date) => string | null) | null>(null);
  readonly dayTone = input<((date: Date) => UiCalendarDayTone) | null>(null);
  readonly dateDisabled = input<((date: Date) => boolean) | null>(null);
  readonly selectedChange = output<Date>();
  readonly hovered = output<Date>();
  readonly viewMonthChange = output<Date>();

  protected readonly i18n = inject(UI_I18N) as Signal<UiI18n>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly today = startOfDay(new Date());

  private readonly activeDate = linkedSignal(
    () => this.selected() ?? this.rangeStart() ?? this.today,
  );
  private readonly viewMonth = computed(() => startOfMonth(this.activeDate()), {
    equal: (left, right) => left.getTime() === right.getTime(),
  });

  constructor() {
    effect(() => this.viewMonthChange.emit(this.viewMonth()));
  }

  private readonly range = computed(() => {
    const start = this.rangeStart();
    if (!start) return null;
    const from = startOfDay(start);
    const to = startOfDay(this.rangeEnd() ?? start);
    return isBefore(to, from) ? { from: to, to: from } : { from, to };
  });

  protected readonly title = computed(() =>
    format(this.viewMonth(), this.monthOnly() ? 'yyyy' : 'LLLL yyyy', {
      locale: this.i18n().locale,
    }),
  );

  protected readonly months = computed(() =>
    Array.from({ length: 12 }, (_, index) => new Date(this.viewMonth().getFullYear(), index, 1)),
  );
  protected monthLabel(date: Date, pattern = 'LLLL yyyy'): string {
    return format(date, pattern, { locale: this.i18n().locale });
  }
  protected isMonthSelected(date: Date): boolean {
    const selected = this.selected();
    return !!selected && isSameMonth(date, selected);
  }
  protected isSameActiveMonth(date: Date): boolean {
    return isSameMonth(date, this.activeDate());
  }
  protected onMonthKeydown(event: KeyboardEvent): void {
    const movement: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -3,
      ArrowDown: 3,
      PageUp: -12,
      PageDown: 12,
    };
    const amount = movement[event.key];
    if (amount === undefined) return;
    event.preventDefault();
    this.activeDate.set(addMonths(this.activeDate(), amount));
    afterNextRender(() => this.focusActive(), { injector: this.injector });
  }

  protected readonly weeks = computed(() => {
    const { weekStartsOn } = this.i18n();
    const month = this.viewMonth();
    const days = eachDayOfInterval({
      start: startOfWeek(month, { weekStartsOn }),
      end: endOfWeek(endOfMonth(month), { weekStartsOn }),
    });
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
  });

  protected readonly weekdays = computed(() => {
    const { locale } = this.i18n();
    return this.weeks()[0].map((day) => ({
      short: format(day, 'EEEEEE', { locale }),
      long: format(day, 'EEEE', { locale }),
    }));
  });

  focusActive(): void {
    this.host.nativeElement.querySelector<HTMLButtonElement>('[data-active]')?.focus();
  }

  protected isActive(day: Date): boolean {
    return isSameDay(day, this.activeDate());
  }

  protected isSelected(day: Date): boolean {
    const selected = this.selected();
    if (selected && isSameDay(day, selected)) return true;
    const start = this.rangeStart();
    const end = this.rangePreview() ? null : this.rangeEnd();
    return (!!start && isSameDay(day, start)) || (!!end && isSameDay(day, end));
  }

  protected bandClasses(day: Date): string {
    const range = this.range();
    if (!range || isSameDay(range.from, range.to)) return '';
    const current = startOfDay(day);
    if (isBefore(current, range.from) || isAfter(current, range.to)) return '';
    const isFrom = isSameDay(current, range.from);
    const isTo = isSameDay(current, range.to);
    const classes = [];
    if (this.rangePreview()) {
      const end = this.rangeEnd()!;
      classes.push('border-y border-dashed border-fg-subtle');
      if (isFrom)
        classes.push(isSameDay(current, end) ? 'rounded-l-full border-l' : 'rounded-l-full');
      if (isTo)
        classes.push(isSameDay(current, end) ? 'rounded-r-full border-r' : 'rounded-r-full');
    } else {
      classes.push('bg-success-soft');
      if (isFrom) classes.push('rounded-l-full');
      if (isTo) classes.push('rounded-r-full');
    }
    return classes.join(' ');
  }

  protected dayClasses(day: Date): string {
    const classes = [
      this.dayCaption()
        ? 'inline-flex size-10 cursor-pointer flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full text-xs transition'
        : 'inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-sm transition',
      'focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-35',
    ];
    const range = this.range();
    const current = startOfDay(day);
    const inBand =
      !!range &&
      !this.rangePreview() &&
      !isBefore(current, range.from) &&
      !isAfter(current, range.to);
    if (this.isSelected(day)) {
      classes.push('bg-brand font-semibold text-on-brand');
    } else if (this.rangePreview() && isSameDay(day, this.rangeEnd()!)) {
      classes.push('bg-surface-muted');
    } else if (inBand) {
      classes.push('text-fg hover:bg-success/10');
    } else {
      classes.push('hover:bg-surface-muted');
      if (!this.isCurrentMonth(day)) classes.push('text-fg-subtle');
    }
    if (this.isToday(day) && !this.isSelected(day)) classes.push('ring-1 ring-border-strong');
    return classes.join(' ');
  }

  protected isToday(day: Date): boolean {
    return isSameDay(day, this.today);
  }

  protected isCurrentMonth(day: Date): boolean {
    return isSameMonth(day, this.viewMonth());
  }

  protected isOutOfRange(day: Date): boolean {
    const min = this.min();
    const max = this.max();
    const outside =
      (!!min && isBefore(day, startOfDay(min))) || (!!max && isAfter(day, startOfDay(max)));
    return outside || !!this.dateDisabled()?.(day);
  }

  protected caption(day: Date): string | null {
    return this.dayCaption()?.(day) ?? null;
  }

  protected captionClasses(day: Date): string {
    const base = 'max-w-full truncate px-0.5 text-[9px] leading-none font-medium';
    const range = this.range();
    const current = startOfDay(day);
    const inBand =
      !!range &&
      !this.rangePreview() &&
      !isBefore(current, range.from) &&
      !isAfter(current, range.to);
    if (this.isSelected(day) || inBand) return `${base} opacity-80`;
    switch (this.dayTone()?.(day)) {
      case 'low':
        return `${base} text-success`;
      case 'high':
        return `${base} text-warning`;
      default:
        return `${base} text-fg-muted`;
    }
  }

  protected dayLabel(day: Date): string {
    return format(day, 'PPPP', { locale: this.i18n().locale });
  }

  protected shiftMonth(amount: number): void {
    this.activeDate.set(addMonths(this.viewMonth(), amount * (this.monthOnly() ? 12 : 1)));
  }

  protected pick(day: Date): void {
    if (this.isOutOfRange(day)) return;
    this.activeDate.set(day);
    this.selectedChange.emit(day);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const { weekStartsOn } = this.i18n();
    const active = this.activeDate();
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(active, -1),
      ArrowRight: () => addDays(active, 1),
      ArrowUp: () => addDays(active, -7),
      ArrowDown: () => addDays(active, 7),
      Home: () => startOfWeek(active, { weekStartsOn }),
      End: () => startOfDay(endOfWeek(active, { weekStartsOn })),
      PageUp: () => addMonths(active, -1),
      PageDown: () => addMonths(active, 1),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    this.activeDate.set(move());
    afterNextRender(() => this.focusActive(), { injector: this.injector });
  }
}
