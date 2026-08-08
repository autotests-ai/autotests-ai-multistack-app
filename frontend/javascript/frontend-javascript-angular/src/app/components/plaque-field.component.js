import { Component, EventEmitter } from '@angular/core';

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
  standalone: true,
  host: {
    class: 'plaque-field',
    '[class.plaque-field--divided]': 'divided',
    '[class.plaque-field--stretch]': 'stretch',
  },
  inputs: [
    'label',
    'controlId',
    'controlName',
    'type',
    'autocomplete',
    'value',
    'testId',
    'labelVariant',
    'divided',
    'stretch',
  ],
  outputs: ['valueChange'],
  template: `
    <span
      [class]="labelVariant === 'param' ? 'plaque-field__label' : 'plaque-field__text'"
      [attr.title]="labelVariant === 'param' ? label : null"
      >{{ label }}</span
    >
    @if (divided) {
      <span class="plaque-divider" aria-hidden="true"></span>
    }
    <input
      [id]="controlId"
      [attr.name]="controlName || controlId"
      class="input plaque-field__control"
      [type]="type"
      [attr.autocomplete]="autocomplete"
      [attr.data-testid]="testId"
      [value]="value"
      (input)="onInput($event)"
    />
  `,
})
export class PlaqueFieldComponent {
  label = '';
  controlId = undefined;
  controlName = undefined;
  type = 'text';
  autocomplete = undefined;
  value = '';
  testId = undefined;
  labelVariant = 'caption';
  divided = true;
  stretch = true;
  valueChange = new EventEmitter();

  onInput(event) {
    this.value = event.target.value;
    this.valueChange.emit(this.value);
  }
}
