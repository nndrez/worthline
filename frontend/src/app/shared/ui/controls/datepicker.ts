import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import {
  addMonths,
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import {
  UI_I18N,
  parseIsoDate,
  toIsoDate,
  UI_FIELD_CLASSES,
  UI_FORM_FIELD,
  UI_OVERLAY_POSITIONS,
  UI_PANEL_CLASSES,
} from './foundation';
import { UiCalendar } from './calendar';
import { isCoarsePointer } from './touch';

@Component({
  selector: 'ui-datepicker',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, UiCalendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full', '[class.ui-month-picker]': 'monthOnly()' },
  template: `
    <div class="relative" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      @if (monthOnly()) {
        <button
          type="button"
          class="absolute inset-y-0 left-0 z-10 inline-flex w-9 items-center justify-center text-fg-muted hover:text-fg"
          [attr.aria-label]="i18n().previousMonth"
          [disabled]="!canShiftMonth(-1)"
          (click)="shiftMonth(-1)"
        >
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </button>
      }
      <input
        #textInput
        type="text"
        inputmode="numeric"
        autocomplete="off"
        [attr.id]="resolvedId()"
        [attr.name]="name() || null"
        [attr.aria-label]="label() ?? null"
        [class]="inputClasses()"
        [attr.data-open]="open() || null"
        [value]="displayValue()"
        [placeholder]="
          placeholder() ?? (monthOnly() ? i18n().monthPlaceholder : i18n().datePlaceholder)
        "
        [disabled]="isDisabled()"
        [attr.aria-describedby]="field?.describedBy() ?? null"
        [attr.aria-invalid]="(invalid() && touched()) || field?.invalid() || null"
        (keydown)="onInputKeydown($event)"
        (blur)="commitText()"
      />
      <button
        type="button"
        class="absolute inset-y-0 inline-flex w-9 cursor-pointer items-center justify-center text-fg-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
        [class.right-9]="monthOnly()"
        [class.right-0]="!monthOnly()"
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
      @if (monthOnly()) {
        <button
          type="button"
          class="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-fg-muted hover:text-fg"
          [attr.aria-label]="i18n().nextMonth"
          [disabled]="!canShiftMonth(1)"
          (click)="shiftMonth(1)"
        >
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </button>
      }
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
      <div role="dialog" [attr.aria-label]="i18n().openCalendar" [class]="panelClasses">
        <ui-calendar
          [selected]="dateValue()"
          [monthOnly]="monthOnly()"
          [min]="minDate()"
          [max]="maxDate()"
          (selectedChange)="pick($event)"
        />
      </div>
    </ng-template>
  `,
})
export class UiDatepicker {
  readonly value = model('');
  readonly monthOnly = input(false);
  readonly earliest = input<string | Date | null>(null);
  readonly latest = input<string | Date | null>(null);
  readonly placeholder = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input<string>();
  readonly label = input<string>();
  readonly name = input('');
  readonly invalid = input(false);
  readonly touched = input(false);
  readonly touch = output<void>();

  protected readonly field = inject(UI_FORM_FIELD, { optional: true });
  protected readonly i18n = inject(UI_I18N);
  private readonly injector = inject(Injector);

  protected readonly positions = UI_OVERLAY_POSITIONS;
  protected readonly scrollStrategy = createRepositionScrollStrategy(this.injector);
  protected readonly inputClasses = computed(
    () => `${UI_FIELD_CLASSES} ${this.monthOnly() ? 'pl-9! pr-18!' : 'pr-10!'}`,
  );
  protected readonly panelClasses = UI_PANEL_CLASSES;

  private readonly textInput = viewChild.required<ElementRef<HTMLInputElement>>('textInput');
  protected readonly calendar = viewChild(UiCalendar);

  protected readonly open = signal(false);

  protected readonly isDisabled = computed(() => this.disabled());
  protected readonly resolvedId = computed(() => this.field?.controlId() ?? this.inputId() ?? null);
  protected readonly dateValue = computed(() => parseIsoDate(this.value()));
  protected readonly minDate = computed(() => parseIsoDate(this.earliest()));
  protected readonly maxDate = computed(() => parseIsoDate(this.latest()));
  protected readonly displayValue = computed(() => {
    const date = this.dateValue();
    return date ? format(date, this.monthOnly() ? 'MM/yyyy' : this.i18n().dateFormat) : '';
  });

  protected onTouched = (): void => this.touch.emit();

  focus(options?: FocusOptions): void {
    this.textInput().nativeElement.focus(options);
  }

  protected canShiftMonth(amount: number): boolean {
    if (this.isDisabled()) return false;
    const target = addMonths(startOfMonth(this.dateValue() ?? new Date()), amount);
    const min = this.minDate();
    const max = this.maxDate();
    return (
      (!min || !isBefore(target, startOfMonth(min))) &&
      (!max || !isAfter(target, startOfMonth(max)))
    );
  }

  protected shiftMonth(amount: number): void {
    if (!this.canShiftMonth(amount)) return;
    const target = addMonths(startOfMonth(this.dateValue() ?? new Date()), amount);
    this.setValue(format(target, 'yyyy-MM'));
    this.onTouched();
    this.close(false);
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
    this.open.set(true);
    afterNextRender(() => this.calendar()?.focusActive(), { injector: this.injector });
  }

  close(restoreFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.onTouched();
    if (restoreFocus && !isCoarsePointer()) this.textInput().nativeElement.focus();
  }

  protected pick(date: Date): void {
    this.setValue(this.monthOnly() ? toIsoDate(date).slice(0, 7) : toIsoDate(date));
    this.close();
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.openPanel();
    } else if (event.key === 'Enter') {
      this.commitText();
    }
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }

  protected commitText(): void {
    const element = this.textInput().nativeElement;
    const text = element.value.trim();
    if (!text) {
      this.setValue(null);
    } else {
      const parsed = parse(
        text,
        this.monthOnly() ? 'MM/yyyy' : this.i18n().dateFormat,
        new Date(),
        {
          locale: this.i18n().locale,
        },
      );
      if (isValid(parsed) && !this.isOutOfRange(parsed))
        this.setValue(this.monthOnly() ? toIsoDate(parsed).slice(0, 7) : toIsoDate(parsed));
    }
    element.value = this.displayValue();
    if (!this.open()) this.onTouched();
  }

  private isOutOfRange(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const day = startOfDay(date);
    return (!!min && isBefore(day, startOfDay(min))) || (!!max && isAfter(day, startOfDay(max)));
  }

  private setValue(value: string | null): void {
    if (value === this.value()) return;
    this.value.set(value ?? '');
  }
}
