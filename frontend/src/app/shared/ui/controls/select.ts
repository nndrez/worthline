import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkListbox, CdkOption, ListboxValueChangeEvent } from '@angular/cdk/listbox';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedPosition,
  createRepositionScrollStrategy,
} from '@angular/cdk/overlay';
import { UI_I18N, UI_FIELD_CLASSES, UI_FORM_FIELD, UI_PANEL_CLASSES } from './foundation';

export interface UiSelectOption<T = unknown> {
  value: T;
  label: string;
  disabled?: boolean;
  hint?: string;
}

export type UiSelectSize = 'md' | 'sm' | 'compact';

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
];

const SIZE_CLASSES: Record<UiSelectSize, string> = {
  md: UI_FIELD_CLASSES,
  sm: `${UI_FIELD_CLASSES} min-h-9 px-3! py-2! text-xs! rounded-lg!`,
  compact: `${UI_FIELD_CLASSES} h-7 py-0! pl-3! pr-2.5! text-xs! leading-none! rounded-[0.4375rem]!`,
};

const TAB_STOP =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

function isTabStop(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.hasAttribute('disabled')) return false;
  if (element.closest('.cdk-overlay-container, .cdk-overlay-popover, [hidden]')) return false;
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function tabSibling(from: HTMLElement, reverse: boolean): HTMLElement | null {
  const elements = [...from.ownerDocument.querySelectorAll<HTMLElement>(TAB_STOP)].filter(
    isTabStop,
  );
  const index = elements.indexOf(from);
  if (index < 0) return null;
  return elements[index + (reverse ? -1 : 1)] ?? null;
}

@Component({
  selector: 'ui-select',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, CdkListbox, CdkOption],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <button
      #trigger
      type="button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      [attr.id]="triggerId()"
      [attr.name]="name() || null"
      [attr.aria-label]="label() ?? null"
      [class]="triggerClasses()"
      [disabled]="isDisabled()"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.data-open]="open() || null"
      [attr.aria-controls]="open() ? listboxId : null"
      [attr.aria-describedby]="field?.describedBy() ?? null"
      [attr.aria-invalid]="(invalid() && touched()) || field?.invalid() || null"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
      (blur)="onTouched()"
    >
      <span class="min-w-0 flex-1 truncate text-left" [class.text-fg-subtle]="!triggerLabel()">
        {{ triggerLabel() ?? placeholder() ?? i18n().selectPlaceholder }}
      </span>
      <svg
        class="shrink-0 text-fg-subtle transition-transform"
        [class.size-4]="size() !== 'compact'"
        [class.size-3.5]="size() === 'compact'"
        [class.rotate-180]="open()"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <ng-template
      cdkConnectedOverlay
      cdkConnectedOverlayUsePopover="inline"
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayMinWidth]="panelWidth()"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayScrollStrategy]="scrollStrategy"
      [cdkConnectedOverlayViewportMargin]="8"
      (overlayOutsideClick)="close(false)"
      (overlayKeydown)="onOverlayKeydown($event)"
      (detach)="close(false)"
    >
      <div [class]="panelClasses()" [style.min-width.px]="panelWidth()">
        @if (searchable()) {
          <div class="flex items-center gap-2 border-b border-border px-3 py-2">
            <svg
              class="size-4 shrink-0 text-fg-subtle"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
              />
            </svg>
            <input
              #searchInput
              type="text"
              class="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
              role="searchbox"
              [attr.aria-label]="i18n().autocompleteSearch"
              [attr.aria-controls]="listboxId"
              [placeholder]="i18n().autocompleteSearch"
              [value]="query()"
              (input)="onQueryInput($event)"
              (keydown)="onSearchKeydown($event)"
            />
          </div>
        }
        <ul
          #listbox
          cdkListbox
          [cdkListboxMultiple]="multiple()"
          [id]="listboxId"
          [cdkListboxValue]="listboxValue()"
          [cdkListboxCompareWith]="compareWith()"
          [attr.aria-labelledby]="triggerId()"
          (cdkListboxValueChange)="onListboxChange($event)"
          [class]="listClasses()"
        >
          @for (option of visibleOptions(); track $index) {
            <li
              [cdkOption]="option.value"
              tabindex="-1"
              (keydown.enter)="onOptionClick(option)"
              [cdkOptionDisabled]="!!option.disabled"
              (click)="onOptionClick(option)"
              class="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-option-hover aria-selected:font-medium aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&.cdk-option-active]:bg-option-hover"
            >
              <svg
                class="size-4 shrink-0"
                [class.invisible]="!isSelected(option)"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />
              </svg>
              <span class="min-w-0 flex-1 break-words">{{ option.label }}</span>
              @if (option.hint) {
                <span class="shrink-0 text-xs text-fg-subtle">{{ option.hint }}</span>
              }
            </li>
          } @empty {
            <li class="px-3 py-2 text-sm text-fg-muted">{{ emptyLabel() }}</li>
          }
        </ul>
      </div>
    </ng-template>
  `,
})
export class UiSelect<T = unknown> {
  readonly options = input<UiSelectOption<T>[]>([]);
  readonly placeholder = input<string>();
  readonly size = input<UiSelectSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly autoSelectSingle = input(false, { transform: booleanAttribute });
  readonly autoOpen = input(false, { transform: booleanAttribute });
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly selectionLimit = input<number | null>(null);
  readonly inputId = input<string>();
  readonly label = input<string>();
  readonly name = input('');
  readonly invalid = input(false);
  readonly touched = input(false);
  readonly touch = output<void>();
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);
  readonly value = model<T>('' as T);
  readonly values = model<T[]>([]);
  readonly autoOpened = output<void>();
  readonly panelClosed = output<void>();
  readonly limitReached = output<void>();

  protected readonly field = inject(UI_FORM_FIELD, { optional: true });
  protected readonly i18n = inject(UI_I18N);
  private readonly injector = inject(Injector);
  private readonly generatedId = inject(_IdGenerator).getId('ui-select-');

  protected readonly positions = POSITIONS;
  protected readonly scrollStrategy = createRepositionScrollStrategy(this.injector);
  protected readonly listboxId = `${this.generatedId}-listbox`;

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly listbox = viewChild<ElementRef<HTMLElement>>('listbox');
  private readonly listboxControl = viewChild(CdkListbox);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly open = signal(false);
  protected readonly panelWidth = signal(0);
  protected readonly query = signal('');
  private readonly current = linkedSignal(() => this.value());

  protected readonly isDisabled = computed(() => this.disabled());
  protected readonly triggerId = computed(
    () => this.field?.controlId() ?? this.inputId() ?? this.generatedId,
  );
  protected readonly triggerClasses = computed(
    () => `${SIZE_CLASSES[this.size()]} flex items-center gap-2 cursor-pointer`,
  );
  protected readonly panelClasses = computed(
    () =>
      `${UI_PANEL_CLASSES} flex max-h-72 w-max max-w-[min(400px,calc(100vw-16px))] flex-col overflow-hidden p-0`,
  );
  protected readonly listClasses = computed(() =>
    this.searchable()
      ? 'min-h-0 flex-1 overflow-auto p-1.5 outline-none'
      : 'overflow-auto p-1.5 outline-none',
  );
  protected readonly visibleOptions = computed(() => {
    const options = this.options();
    if (!this.searchable()) return options;
    const term = this.query().trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  });
  protected readonly emptyLabel = computed(() =>
    this.searchable() && this.query().trim()
      ? this.i18n().autocompleteEmpty
      : this.i18n().noOptions,
  );
  protected readonly listboxValue = computed<T[]>(() => {
    const selected = this.multiple()
      ? this.values()
      : this.selected()
        ? [this.selected()!.value]
        : [];
    const compare = this.compareWith();
    return selected.filter((value) =>
      this.visibleOptions().some((option) => compare(option.value, value)),
    );
  });
  protected readonly selected = computed(() => {
    const value = this.current();
    if (value == null) return null;
    const compare = this.compareWith();
    return this.options().find((option) => compare(option.value, value)) ?? null;
  });
  protected readonly triggerLabel = computed(() => {
    if (!this.multiple()) return this.selected()?.label ?? null;
    const compare = this.compareWith();
    const labels = this.options()
      .filter((option) => this.values().some((value) => compare(option.value, value)))
      .map((option) => option.label);
    if (!labels.length) return null;
    if (labels.length <= 2) return labels.join(', ');
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
  });

  protected onTouched = (): void => this.touch.emit();

  constructor() {
    effect(() => {
      const options = this.options();
      if (this.multiple() || !this.autoSelectSingle() || this.isDisabled() || options.length !== 1)
        return;
      const only = options[0].value;
      const current = untracked(() => this.current());
      if (current != null && this.compareWith()(only, current)) return;
      untracked(() => this.commit(only));
    });

    afterNextRender(() => {
      if (!this.autoOpen()) return;
      this.openPanel();
      this.autoOpened.emit();
    });
  }

  protected isSelected(option: UiSelectOption<T>): boolean {
    const compare = this.compareWith();
    if (this.multiple()) return this.values().some((value) => compare(option.value, value));
    const value = this.current();
    return value != null && compare(option.value, value);
  }

  protected toggle(): void {
    if (this.open()) {
      this.close(false);
    } else {
      this.openPanel();
    }
  }

  focus(options?: FocusOptions): void {
    this.trigger().nativeElement.focus(options);
  }

  openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.onTouched();
    this.panelWidth.set(this.trigger().nativeElement.offsetWidth);
    this.query.set('');
    this.open.set(true);
    afterNextRender(
      () => {
        if (this.searchable()) this.searchInput()?.nativeElement.focus();
        else this.listbox()?.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  close(restoreFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.query.set('');
    this.panelClosed.emit();
    if (restoreFocus) this.focusLater(this.trigger().nativeElement);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      this.openPanel();
    }
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const trigger = this.trigger().nativeElement;
      const target = tabSibling(trigger, event.shiftKey) ?? trigger;
      this.close(false);
      this.focusLater(target);
    } else if ((event.key === 'Enter' || event.key === ' ') && !this.multiple()) {
      if (this.isSearchTarget(event)) return;
      event.preventDefault();
      this.close();
    }
  }

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.listbox()?.nativeElement.focus();
    }
  }

  private isSearchTarget(event: Event): boolean {
    return this.searchable() && event.target === this.searchInput()?.nativeElement;
  }

  private focusLater(element: HTMLElement): void {
    afterNextRender(
      () => {
        queueMicrotask(() => {
          if (element.isConnected) element.focus();
        });
      },
      { injector: this.injector },
    );
  }

  protected onOptionClick(option: UiSelectOption<T>): void {
    if (this.multiple() || option.disabled) return;
    if (this.isSelected(option)) this.close();
  }

  protected onListboxChange(event: ListboxValueChangeEvent<T>): void {
    if (this.multiple()) {
      this.commitMany(event.value);
      return;
    }
    if (!event.value.length) {
      this.close();
      return;
    }
    this.commit(event.value[0]);
    this.close();
  }

  private commitMany(visibleSelection: readonly T[]): void {
    const compare = this.compareWith();
    const visible = this.visibleOptions();
    const kept = this.values().filter(
      (value) => !visible.some((option) => compare(option.value, value)),
    );
    const next = [...kept, ...visibleSelection];
    const limit = this.selectionLimit();
    if (limit != null && next.length > limit) {
      const listbox = this.listboxControl();
      if (listbox) listbox.value = this.listboxValue();
      this.limitReached.emit();
      return;
    }
    this.values.set(next);
  }

  private commit(next: T): void {
    this.current.set(next);
    this.value.set(next);
  }
}
