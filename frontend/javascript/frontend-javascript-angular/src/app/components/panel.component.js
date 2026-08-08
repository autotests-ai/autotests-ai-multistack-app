import { Component } from '@angular/core';

/**
 * Thin wrapper over the design-system panel markup.
 *
 * The `.panel` classes live on the **host**, so `<app-panel>` itself is the `.panel`:
 * `panel.css` and `auth.css` both rely on `.panel__bar` / `.panel__body` being direct
 * children and on `.auth-panel.panel` being one element.
 *
 * Only what the template cannot express is an input. `data-testid`, extra classes and
 * `hidden` are plain host attributes / native properties at the call site, which keeps
 * the rendered DOM identical to the React and Vue modules — a static attribute that
 * matches an input is *also* reflected onto the element by Angular, so `testId="…"`
 * would emit a stray lowercase `testid` attribute next to `data-testid`.
 */
@Component({
  selector: 'app-panel',
  standalone: true,
  host: { class: 'panel panel--content' },
  // Declared here instead of with `@Input()` so each class carries exactly one
  // decorator — see README, "Angular without TypeScript".
  inputs: ['title', 'titleTestId', 'bodyClassName'],
  template: `
    <div class="panel__bar">
      <div class="panel__dots" aria-hidden="true">
        <span class="panel__dot"></span>
        <span class="panel__dot"></span>
        <span class="panel__dot"></span>
      </div>
      <div class="panel__trail">
        @if (title) {
          <span class="panel__title" [attr.data-testid]="titleTestId">{{ title }}</span>
        }
      </div>
    </div>
    <div class="panel__body" [class]="bodyClassName">
      <ng-content></ng-content>
    </div>
  `,
})
export class PanelComponent {
  title = '';
  titleTestId = undefined;
  bodyClassName = '';
}
