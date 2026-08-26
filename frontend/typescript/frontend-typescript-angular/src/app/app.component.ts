import { Component, computed, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from '../i18n';
import { AppHeaderComponent } from './components/app-header.component';
import { appPath } from './lib/app-base';
import { buildHeaderConfig, syncHeaderNav } from './lib/header-config';

@Component({
  selector: 'app-root',
  imports: [AppHeaderComponent, RouterOutlet],
  providers: [I18nService],
  template: `
    <app-header [config]="headerConfig()" [scriptSrc]="headerScriptSrc" />
    <router-outlet />
  `,
})
export class AppComponent {
  private readonly i18n = inject(I18nService);
  private navKey: string | null = null;

  readonly headerScriptSrc = appPath('/js/header.js');
  readonly headerConfig = computed(() => buildHeaderConfig(this.i18n.lang()));

  constructor() {
    effect(() => {
      this.navKey = syncHeaderNav(this.headerConfig(), this.navKey);
    });
  }
}
