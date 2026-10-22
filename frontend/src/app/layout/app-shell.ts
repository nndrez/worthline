import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Icon } from '../shared/ui/icon';
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe, Icon],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  protected readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly i18n = inject(TranslateService);
  private readonly contentMain = viewChild<ElementRef<HTMLElement>>('contentMain');

  protected resetContentScroll(): void {
    const content = this.contentMain()?.nativeElement;
    if (content) {
      content.scrollTop = 0;
      content.scrollLeft = 0;
    }
  }
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const key = event.urlAfterRedirects.split('?')[0].split('/')[1];
        const titleKey =
          key === 'investment-operations' ? 'operations' : key === 'portfolio' ? 'portfolio' : key;
        this.title.setTitle(`${this.i18n.instant('nav.' + titleKey)} · Worthline`);
      }
    });
  }
}
