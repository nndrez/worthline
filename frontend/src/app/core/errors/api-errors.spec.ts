import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { ApiErrors } from './api-errors';
import italian from '../../../../public/i18n/it.json';

describe('Italian error translation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ lang: 'it', fallbackLang: 'it' })],
    });
    TestBed.inject(TranslateService).setTranslation('it', italian);
  });
  it('translates the backend errorCode without exposing its fallback message', () => {
    const translated = TestBed.inject(ApiErrors).translate(
      new HttpErrorResponse({
        status: 422,
        error: JSON.stringify({
          errorCode: 'category.type.mismatch',
          message: 'Internal fallback',
        }),
      }),
    );
    expect(translated.message).toBe('Scegli una categoria dello stesso tipo del movimento.');
  });
  it('uses an Italian fallback for unknown errors and translates field names', () => {
    const translated = TestBed.inject(ApiErrors).translate(
      new HttpErrorResponse({
        status: 400,
        error: {
          errorCode: 'new.unknown.code',
          message: 'Sensitive',
          fields: [{ field: 'amount' }],
          requestId: 'test-id',
        },
      }),
    );
    expect(translated.message).toBe(italian.errors.generic);
    expect(translated.fields).toEqual(['Importo']);
    expect(translated.requestId).toBe('test-id');
  });
  it('explains unavailable backend connections', () => {
    expect(TestBed.inject(ApiErrors).translate(new HttpErrorResponse({ status: 0 })).message).toBe(
      italian.errors.connection,
    );
  });
});
