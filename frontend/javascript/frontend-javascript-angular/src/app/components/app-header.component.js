import { Component } from '@angular/core';

/**
 * The design-system header is SSOT in `js/header.js` and is **not** reimplemented
 * here. This component only publishes `window.headerConfig` and injects the runtime
 * script once — the same contract `AppHeader.vue` implements for the Vue module.
 *
 * The host element carries `id="app-header"`, which is the mount `header.js` looks
 * up; that keeps the DOM one level flatter than an inner `<div>` would.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  host: {
    '[id]': 'mountId',
    'data-testid': 'app-header-mount',
  },
  inputs: ['config', 'scriptSrc', 'mountId'],
  template: '',
})
export class AppHeaderComponent {
  config = null;
  scriptSrc = '/js/header.js';
  mountId = 'app-header';

  ngOnChanges() {
    this.publishConfig();
  }

  ngOnInit() {
    this.publishConfig();
  }

  publishConfig() {
    if (typeof window === 'undefined' || !this.config) {
      return;
    }
    window.headerConfig = this.config;

    if (!document.querySelector('script[data-header-embed]')) {
      const headerScript = document.createElement('script');
      headerScript.type = 'module';
      headerScript.src = this.scriptSrc;
      headerScript.dataset.headerEmbed = 'true';
      document.body.appendChild(headerScript);
    }
  }
}
