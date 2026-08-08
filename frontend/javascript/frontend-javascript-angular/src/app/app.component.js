import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './components/app-header.component.js';
import { appPath } from './lib/app-base.js';
import { headerConfig } from './lib/header-config.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppHeaderComponent, RouterOutlet],
  template: `
    <app-header [config]="headerConfig" [scriptSrc]="headerScriptSrc"></app-header>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  headerConfig = headerConfig;
  headerScriptSrc = appPath('/js/header.js');
}
