import { Component, input } from '@angular/core';

/**
 * Design-system panel chrome (bar with dots + title, then body). Attribute
 * selector on a `div` so the rendered markup is the same `.panel.panel--content`
 * element the other frontend modules ship — no extra wrapper node.
 */
@Component({
  selector: 'div[appPanel]',
  host: { class: 'panel panel--content' },
  template: `
    <div class="panel__bar">
      <div class="panel__dots" aria-hidden="true">
        <span class="panel__dot"></span>
        <span class="panel__dot"></span>
        <span class="panel__dot"></span>
      </div>
      <div class="panel__trail">
        @if (panelTitle()) {
          <span class="panel__title" [attr.data-testid]="titleTestId()">{{ panelTitle() }}</span>
        }
      </div>
    </div>
    <div class="panel__body" [class]="bodyClassName()">
      <ng-content />
    </div>
  `,
})
export class PanelComponent {
  readonly panelTitle = input('');
  readonly titleTestId = input<string | undefined>(undefined);
  readonly bodyClassName = input('');
}
