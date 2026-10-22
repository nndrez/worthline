import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { format, isAfter, isBefore, isValid, parse, startOfDay } from 'date-fns';
import {
  UI_I18N,
  parseIsoDate,
  toIsoDate,
  UI_FIELD_ACTIVE_CLASSES,
  UI_FORM_FIELD,
  UI_OVERLAY_POSITIONS,
  UI_PANEL_CLASSES,
} from './foundation';
import { UiCalendar, UiCalendarDayTone } from './calendar';
import { isCoarsePointer } from './touch';

const EMPTY: UiDateRange = { start: null, end: null };

export interface UiDateRange {
  start: string | null;
  end: string | null;
}

@Component({
  selector: 'ui-date-range-picker',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, UiCalendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDateRangePicker), multi: true },
  ],
  host: { class: 'block w-full' },
  template: `
    <div
      [class]="wrapperClasses"
      [attr.data-open]="open() || null"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
    >
      <input
        #startInput
        type="text"
        inputmode="numeric"
        autocomplete="off"
        [class]="inputClass()"
        [attr.size]="startSize()"
        [attr.id]="resolvedId()"
        [attr.name]="name() ?? null"
        [value]="startDisplay()"
        [placeholder]="startPlaceholder() ?? i18n().rangeStart"
        [disabled]="isDisabled()"
        [attr.aria-label]="i18n().rangeStart"
        [attr.aria-describedby]="field?.describedBy() ?? null"
        [attr.aria-invalid]="field?.invalid() || null"
        (focus)="lastFocus.set('start')"
        (click)="onFieldClick()"
        (keydown)="onInputKeydown($event, 'start')"
        (blur)="commit('start')"
      />
      @if (separator() === 'arrow') {
        <svg
          class="mx-1 size-4 shrink-0 text-fg-subtle"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      } @else {
        <span class="px-1 text-fg-subtle" aria-hidden="true">–</span>
      }
      <input
        #endInput
        type="text"
        inputmode="numeric"
        autocomplete="off"
        [class]="endInputClass()"
        [attr.id]="endId()"
        [value]="endDisplay()"
        [placeholder]="endPlaceholder() ?? i18n().rangeEnd"
        [disabled]="isDisabled()"
        [attr.aria-label]="i18n().rangeEnd"
        [attr.aria-describedby]="field?.describedBy() ?? null"
        [attr.aria-invalid]="field?.invalid() || null"
        (focus)="lastFocus.set('end')"
        (click)="onFieldClick()"
        (keydown)="onInputKeydown($event, 'end')"
        (blur)="commit('end')"
      />
      @if (hasSelection()) {
        <button
          type="button"
          class="absolute inset-y-0 right-9 inline-flex w-8 cursor-pointer items-center justify-center text-fg-muted hover:text-fg"
          [attr.aria-label]="i18n().clearRange"
          [disabled]="isDisabled()"
          (click)="clearSelection($event)"
        >
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      }
      <button
        type="button"
        class="absolute inset-y-0 right-0 inline-flex w-10 cursor-pointer items-center justify-center text-fg-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
        [attr.aria-label]="i18n().openCalendar"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()"
        [disabled]="isDisabled()"
        (click)="toggle()"
      >
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path stroke-linecap="round" d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      </button>
    </div>

    <ng-template
      cdkConnectedOverlay
      cdkConnectedOverlayUsePopover="inline"
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayScrollStrategy]="scrollStrategy"
      [cdkConnectedOverlayViewportMargin]="8"
      (overlayOutsideClick)="close(false)"
      (overlayKeydown)="onOverlayKeydown($event)"
      (detach)="close(false)"
    >
      <div
        role="dialog"
        [attr.aria-label]="i18n().openCalendar"
        [class]="panelClasses"
        (pointerleave)="preview.set(null)"
      >
        <ui-calendar
          [rangeStart]="startDate()"
          [rangeEnd]="shownEnd()"
          [rangePreview]="!endDate() && !!preview()"
          [min]="minDate()"
          [max]="maxDate()"
          [dayCaption]="dayCaption()"
          [dayTone]="dayTone()"
          [dateDisabled]="dateDisabled()"
          (hovered)="onHover($event)"
          (selectedChange)="pick($event)"
          (viewMonthChange)="viewMonthChange.emit($event)"
        />
        <ng-content />
      </div>
    </ng-template>
  `,
})
export class UiDateRangePicker implements ControlValueAccessor {
  readonly value = model<UiDateRange>(EMPTY);
  readonly min = input<string | Date | null>(null);
  readonly max = input<string | Date | null>(null);
  readonly dayCaption = input<((date: Date) => string | null) | null>(null);
  readonly dayTone = input<((date: Date) => UiCalendarDayTone) | null>(null);
  readonly dateDisabled = input<((date: Date) => boolean) | null>(null);
  readonly startPlaceholder = input<string>();
  readonly endPlaceholder = input<string>();
  readonly separator = input<'dash' | 'arrow'>('dash');
  readonly compact = input(false, { transform: booleanAttribute });
  readonly autoOpen = input(false, { transform: booleanAttribute });
  readonly openOnClick = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly name = input<string>();
  readonly autoOpened = output<void>();
  readonly pickerClosed = output<void>();
  readonly viewMonthChange = output<Date>();

  protected readonly field = inject(UI_FORM_FIELD, { optional: true });
  protected readonly i18n = inject(UI_I18N);
  private readonly injector = inject(Injector);

  protected readonly positions = UI_OVERLAY_POSITIONS;
  protected readonly scrollStrategy = createRepositionScrollStrategy(this.injector);
  protected readonly panelClasses = UI_PANEL_CLASSES;

  private readonly startInput = viewChild.required<ElementRef<HTMLInputElement>>('startInput');
  private readonly endInput = viewChild.required<ElementRef<HTMLInputElement>>('endInput');
  protected readonly calendar = viewChild(UiCalendar);

  protected readonly open = signal(false);
  protected readonly preview = signal<Date | null>(null);
  protected readonly lastFocus = signal<'start' | 'end'>('start');
  private readonly disabledByForm = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly resolvedId = computed(() => this.field?.controlId() ?? this.inputId() ?? null);
  protected readonly endId = computed(() => {
    const id = this.resolvedId();
    return id ? `${id}-end` : null;
  });
  protected readonly hasSelection = computed(() => !!(this.value().start || this.value().end));
  protected readonly startDate = computed(() => parseIsoDate(this.value().start));
  protected readonly endDate = computed(() => parseIsoDate(this.value().end));
  protected readonly shownEnd = computed(() => this.endDate() ?? this.preview());
  protected readonly minDate = computed(() => parseIsoDate(this.min()));
  protected readonly maxDate = computed(() => parseIsoDate(this.max()));
  protected readonly startDisplay = computed(() => this.format(this.startDate()));
  protected readonly endDisplay = computed(() => this.format(this.endDate()));
  protected readonly wrapperClasses =
    'relative flex w-full items-center rounded-field border border-field-border bg-field text-sm text-fg shadow-field backdrop-blur-field transition ' +
    `${UI_FIELD_ACTIVE_CLASSES} ` +
    'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-aria-invalid:border-danger has-aria-invalid:focus-within:ring-danger/15';
  private readonly inputBase = 'min-w-0 bg-transparent outline-none placeholder:text-fg-subtle';
  protected readonly inputClass = computed(() =>
    this.compact()
      ? `${this.inputBase} shrink-0 [field-sizing:content] py-1 pl-2 pr-1 text-xs`
      : `${this.inputBase} shrink-0 [field-sizing:content] py-[var(--ui-field-py,0.625rem)] pl-[var(--ui-field-px,0.875rem)] pr-1`,
  );
  protected readonly endInputClass = computed(() =>
    this.compact()
      ? `${this.inputBase} flex-1 py-1 pl-1 text-xs ${this.hasSelection() ? 'pr-16' : 'pr-10'}`
      : `${this.inputBase} flex-1 py-[var(--ui-field-py,0.625rem)] pl-1 ${this.hasSelection() ? 'pr-16' : 'pr-10'}`,
  );
  protected readonly startSize = computed(
    () =>
      Math.max(
        this.startDisplay().length,
        (this.startPlaceholder() ?? this.i18n().rangeStart).length,
        1,
      ) + 1,
  );

  constructor() {
    afterNextRender(() => {
      if (!this.autoOpen()) return;
      this.openPanel();
      this.autoOpened.emit();
    });
  }

  private onChange: (value: UiDateRange) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: UiDateRange | null): void {
    this.value.set({ start: value?.start || null, end: value?.end || null });
  }

  registerOnChange(fn: (value: UiDateRange) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  protected onFieldClick(): void {
    if (this.openOnClick()) this.openPanel();
  }

  protected clearSelection(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.preview.set(null);
    this.emit({ start: null, end: null });
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.preview.set(null);
    this.open.set(true);
    afterNextRender(() => this.calendar()?.focusActive(), { injector: this.injector });
  }

  close(restoreFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.preview.set(null);
    this.onTouched();
    this.pickerClosed.emit();
    if (!restoreFocus || isCoarsePointer()) return;
    const input = this.lastFocus() === 'end' ? this.endInput() : this.startInput();
    input.nativeElement.focus();
  }

  protected onHover(day: Date): void {
    if (this.startDate() && !this.endDate() && !this.isOutOfRange(day)) {
      this.preview.set(day);
    }
  }

  protected pick(date: Date): void {
    if (this.isOutOfRange(date)) return;
    const iso = toIsoDate(date);
    const start = this.value().start;
    const end = this.value().end;
    if (!start || end) {
      this.emit({ start: iso, end: null });
      this.preview.set(null);
      return;
    }
    this.emit(iso < start ? { start: iso, end: start } : { start, end: iso });
    this.preview.set(null);
    this.close();
  }

  protected onInputKeydown(event: KeyboardEvent, side: 'start' | 'end'): void {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.lastFocus.set(side);
      this.openPanel();
    } else if (event.key === 'Enter') {
      this.commit(side);
    }
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }

  protected commit(side: 'start' | 'end'): void {
    const element = (side === 'start' ? this.startInput() : this.endInput()).nativeElement;
    const text = element.value.trim();
    const current = this.value();
    if (!text) {
      this.emit({ ...current, [side]: null });
    } else {
      const parsed = parse(text, this.i18n().dateFormat, new Date(), {
        locale: this.i18n().locale,
      });
      if (isValid(parsed) && !this.isOutOfRange(parsed)) {
        this.emit({ ...current, [side]: toIsoDate(parsed) });
      }
    }
    element.value = side === 'start' ? this.startDisplay() : this.endDisplay();
    if (!this.open()) this.onTouched();
  }

  private format(date: Date | null): string {
    return date ? format(date, this.i18n().dateFormat) : '';
  }

  protected isOutOfRange(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const day = startOfDay(date);
    const outside =
      (!!min && isBefore(day, startOfDay(min))) || (!!max && isAfter(day, startOfDay(max)));
    return outside || !!this.dateDisabled()?.(date);
  }

  protected emit(next: UiDateRange): void {
    const current = this.value();
    if (current.start === next.start && current.end === next.end) return;
    this.value.set(next);
    this.onChange(next);
  }
}
