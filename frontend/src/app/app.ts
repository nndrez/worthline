import { Component } from '@angular/core';
import { AppShell } from './layout/app-shell';
@Component({
  selector: 'app-root',
  imports: [AppShell],
  template: '<app-shell />',
  styles: ':host{display:block;min-width:0}',
})
export class App {}
