import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import italianLocale from '@angular/common/locales/it';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
registerLocaleData(italianLocale, 'it-IT');
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: true } },
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'it-IT' },
    provideTranslateService({
      lang: 'it',
      fallbackLang: 'it',
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    }),
    provideAppInitializer(() => firstValueFrom(inject(TranslateService).use('it'))),
  ],
};
