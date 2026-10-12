import { Component, input, output } from '@angular/core';

export type PlaqueFieldLabelVariant = 'param' | 'caption';

/**
 * Label + control plaque. Host is the `<label>` (implicit control association,
 * and `plaque-field.css` targets `> .plaque-field__control` directly).
 *
 * `controlId` / `controlName` / `testId` rather than `id` / `name` / `data-testid`:
 * the plain attributes would land on the host `<label>`, but the reference markup
 * puts all three on the `<input>`. Call sites therefore bind literals (`[label]="'Login'"`)
 * — a static attribute matching an input is also reflected onto the host element.
 */
@Component({
  selector: 'label[app-plaque-field]',
  host: {
    class: 'plaque-field',
    '[class.plaque-field--divided]': 'divided()',
    '[class.plaque-field--stretch]': 'stretch()',
  },
  template: `
    <span
      [class]="labelVariant() === 'param' ? 'plaque-field__label' : 'plaque-field__text'"
      [attr.title]="labelVariant() === 'param' ? label() : null"
      >{{ label() }}</span
    >
    @if (divided()) {
      <span class="plaque-divider" aria-hidden="true"></span>
    }
    <input
      [id]="controlId()"
      [attr.name]="controlName() || controlId()"
      class="input plaque-field__control"
      [type]="type()"
      [attr.autocomplete]="autocomplete()"
      [attr.data-testid]="testId()"
      [value]="value()"
      (input)="onInput($event)"
    />
  `,
})
export class PlaqueFieldComponent {
  readonly label = input('');
  readonly controlId = input<string | undefined>(undefined);
  readonly controlName = input<string | undefined>(undefined);
  readonly type = input('text');
  readonly autocomplete = input<string | undefined>(undefined);
  readonly value = input('');
  readonly testId = input<string | undefined>(undefined);
  readonly labelVariant = input<PlaqueFieldLabelVariant>('caption');
  readonly divided = input(true);
  readonly stretch = input(true);
  readonly valueChange = output<string>();

  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
