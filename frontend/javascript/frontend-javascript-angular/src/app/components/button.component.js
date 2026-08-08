import { Component } from '@angular/core';

/**
 * Attribute selector, not an element: the host **is** the native `<button>`, so
 * `type="submit"` still submits the form it sits in and the rendered markup matches
 * the other modules (`<button class="btn btn--primary">`).
 *
 * `btn--block` and `disabled` need no input — a static `class` merges with the host
 * class, and `disabled` is a native property the call site can bind directly.
 */
@Component({
  selector: 'button[app-button]',
  standalone: true,
  host: {
    class: 'btn',
    '[class.btn--primary]': "variant === 'primary'",
    '[class.btn--secondary]': "variant === 'secondary'",
    '[class.btn--ghost]': "variant === 'ghost'",
    '[class.btn--danger]': "variant === 'danger'",
  },
  inputs: ['variant'],
  template: '<ng-content></ng-content>',
})
export class ButtonComponent {
  variant = 'primary';
}
