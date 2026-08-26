import { Component, computed, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './components/app-header.component.js';
import { useI18n } from './i18n/index.js';
import { appPath } from './lib/app-base.js';
import { buildHeaderConfig, syncHeaderNav } from './lib/header-config.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppHeaderComponent, RouterOutlet],
  template: `
    <app-header [config]="headerConfig()" [scriptSrc]="headerScriptSrc"></app-header>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  i18n = useI18n();
  headerScriptSrc = appPath('/js/header.js');
  headerConfig = computed(() => buildHeaderConfig(this.i18n.lang()));
  navKey = null;

  constructor() {
    effect(() => {
      this.navKey = syncHeaderNav(this.headerConfig(), this.navKey);
    });
  }
}
