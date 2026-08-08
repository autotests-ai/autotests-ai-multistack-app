import { Component, effect, input } from '@angular/core';
import type { HeaderConfig } from '../lib/header-config';

/**
 * The design-system header is SSOT in `js/header.js` and is not reimplemented in
 * Angular: this component only owns the `#app-header` mount, publishes
 * `window.headerConfig` and embeds the runtime script once. `header.js` resolves
 * the mount lazily, so the embed order against this view does not matter.
 */
@Component({
  selector: 'app-header',
  template: `<div [id]="mountId()" data-testid="app-header-mount"></div>`,
})
export class AppHeaderComponent {
  readonly config = input.required<HeaderConfig>();
  readonly scriptSrc = input('/js/header.js');
  readonly mountId = input('app-header');

  constructor() {
    effect(() => {
      publishConfig(this.config(), this.scriptSrc());
    });
  }
}

function publishConfig(config: HeaderConfig, scriptSrc: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.headerConfig = config;

  if (!document.querySelector('script[data-header-embed]')) {
    const headerScript = document.createElement('script');
    headerScript.type = 'module';
    headerScript.src = scriptSrc;
    headerScript.dataset.headerEmbed = 'true';
    document.body.appendChild(headerScript);
  }
}
