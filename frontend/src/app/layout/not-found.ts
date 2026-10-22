import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  imports: [RouterLink, TranslatePipe],
  template:
    '<section class="panel p-12 text-center"><h1 class="text-2xl mb-6">{{ "app.notFound" | translate }}</h1><a routerLink="/overview" class="btn">{{ "app.backHome" | translate }}</a></section>',
})
export class NotFound {}
