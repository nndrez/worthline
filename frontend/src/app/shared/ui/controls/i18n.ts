import { computed, inject, InjectionToken, Signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { Day, Locale } from 'date-fns';
import { it } from 'date-fns/locale/it';

export interface UiI18n {
  locale: Locale;
  weekStartsOn: Day;
  dateFormat: string;
  datePlaceholder: string;
  selectPlaceholder: string;
  noOptions: string;
  autocompletePlaceholder: string;
  autocompleteSearch: string;
  autocompleteEmpty: string;
  clear: string;
  openCalendar: string;
  rangeStart: string;
  rangeEnd: string;
  clearRange: string;
  previousMonth: string;
  nextMonth: string;
  close: string;
  previousYear: string;
  nextYear: string;
  monthPlaceholder: string;
}

export const UI_I18N = new InjectionToken<Signal<UiI18n>>('UI_I18N', {
  providedIn: 'root',
  factory: () => {
    const translate = inject(TranslateService);
    return computed(() => ({
      locale: it,
      weekStartsOn: 1,
      dateFormat: 'dd/MM/yyyy',
      datePlaceholder: translate.instant('controls.datePlaceholder') as string,
      selectPlaceholder: translate.instant('controls.selectPlaceholder') as string,
      noOptions: translate.instant('controls.noOptions') as string,
      autocompletePlaceholder: translate.instant('controls.autocompletePlaceholder') as string,
      autocompleteSearch: translate.instant('controls.autocompleteSearch') as string,
      autocompleteEmpty: translate.instant('controls.autocompleteEmpty') as string,
      clear: translate.instant('controls.clear') as string,
      openCalendar: translate.instant('controls.openCalendar') as string,
      rangeStart: translate.instant('controls.rangeStart') as string,
      rangeEnd: translate.instant('controls.rangeEnd') as string,
      clearRange: translate.instant('controls.clearRange') as string,
      previousMonth: translate.instant('controls.previousMonth') as string,
      nextMonth: translate.instant('controls.nextMonth') as string,
      close: translate.instant('controls.close') as string,
      previousYear: translate.instant('controls.previousYear') as string,
      nextYear: translate.instant('controls.nextYear') as string,
      monthPlaceholder: translate.instant('controls.monthPlaceholder') as string,
    }));
  },
});
