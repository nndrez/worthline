import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import translations from '../../../../../public/i18n/it.json';
import { UiSelect } from './select';
import { UiDatepicker } from './datepicker';

describe('shared Insula controls', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService({ lang: 'it' })] });
    TestBed.inject(TranslateService).setTranslation('it', translations);
  });

  it('preserves hidden multiple selections while searching and enforces the selection limit', async () => {
    const fixture = TestBed.createComponent(UiSelect<string>);
    fixture.componentRef.setInput('options', [
      { value: 'cash', label: 'Liquidità' },
      { value: 'fund', label: 'Fondi' },
      { value: 'pension', label: 'Pensione' },
    ]);
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('selectionLimit', 2);
    fixture.componentRef.setInput('values', ['cash']);
    fixture.detectChanges();
    fixture.componentInstance.openPanel();
    await fixture.whenStable();
    const search = document.querySelector<HTMLInputElement>('[role="searchbox"]')!;
    search.value = 'Fondi';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    const option = document.querySelector<HTMLElement>('[role="option"]')!;
    option.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.values()).toEqual(['cash', 'fund']);
    search.value = 'Pensione';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    document.querySelector<HTMLElement>('[role="option"]')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.values()).toEqual(['cash', 'fund']);
    expect(document.querySelector('[role="option"]')?.getAttribute('aria-selected')).toBe('false');
    fixture.destroy();
  });

  it('accepts Italian dates as civil ISO values and clears a required field to an empty string', async () => {
    const fixture = TestBed.createComponent(UiDatepicker);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '31/10/2026';
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('2026-10-31');
    input.value = '';
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('rejects impossible dates and dates beyond an explicit upper bound', async () => {
    const fixture = TestBed.createComponent(UiDatepicker);
    fixture.componentRef.setInput('value', '2026-10-15');
    fixture.componentRef.setInput('latest', '2026-10-31');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    for (const text of ['31/02/2026', '01/11/2026']) {
      input.value = text;
      input.dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(fixture.componentInstance.value()).toBe('2026-10-15');
      expect(input.value).toBe('15/10/2026');
    }
  });

  it('uses the shared picker for month values without adding a day or shifting time zones', async () => {
    const fixture = TestBed.createComponent(UiDatepicker);
    fixture.componentRef.setInput('monthOnly', true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '02/2026';
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('2026-02');
    expect(input.value).toBe('02/2026');
  });

  it('steps across years and disables month arrows at configured boundaries', async () => {
    const fixture = TestBed.createComponent(UiDatepicker);
    fixture.componentRef.setInput('monthOnly', true);
    fixture.componentRef.setInput('value', '2026-01');
    fixture.componentRef.setInput('earliest', '2025-12');
    fixture.componentRef.setInput('latest', '2026-01');
    fixture.detectChanges();
    const previous = fixture.nativeElement.querySelector(
      '[aria-label="Mese precedente"]',
    ) as HTMLButtonElement;
    const next = fixture.nativeElement.querySelector(
      '[aria-label="Mese successivo"]',
    ) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    previous.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('2025-12');
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    next.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('2026-01');
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(true);
  });
});
