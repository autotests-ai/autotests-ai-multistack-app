import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './components/app-header.component';
import { appPath } from './lib/app-base';
import { headerConfig } from './lib/header-config';

@Component({
  selector: 'app-root',
  imports: [AppHeaderComponent, RouterOutlet],
  template: `
    <app-header [config]="headerConfig" [scriptSrc]="headerScriptSrc" />
    <router-outlet />
  `,
})
export class AppComponent {
  readonly headerConfig = headerConfig;
  readonly headerScriptSrc = appPath('/js/header.js');
}
