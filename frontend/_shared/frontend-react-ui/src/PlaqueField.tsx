import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';
import { Input } from './Input';

export type PlaqueFieldLabelVariant = 'param' | 'caption';

export interface PlaqueFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  className?: string;
  divided?: boolean;
  stretch?: boolean;
  /** `data-param-id` for wiring / e2e. */
  paramId?: string;
  /**
   * `param` → `.plaque-field__label` (configurator ids: `name`, `remoteUrl`).
   * `caption` → `.plaque-field__text` (auth human captions: Login / Password).
   */
  labelVariant?: PlaqueFieldLabelVariant;
}

/**
 * Divided plaque with a text `input` control. Canon:
 * - param id + input → `templates/plaque-field.html` `plaque-field-text`
 * - human caption + input → `plaque-field-caption-input`
 * Thin wrapper — label / divider / control slots stay SSOT in `plaque-field.css`.
 */
export function PlaqueField({
  label,
  className,
  divided = true,
  stretch = true,
  paramId,
  labelVariant = 'caption',
  id,
  name,
  ...inputProps
}: PlaqueFieldProps) {
  const labelClass =
    labelVariant === 'param' ? 'plaque-field__label' : 'plaque-field__text';
  // Autofill / DevTools: form controls need id or name. Prefer explicit props,
  // then configurator paramId (Capabilities / remote-hub).
  const controlId = id ?? paramId;
  const controlName = name ?? paramId ?? id;

  return (
    <label
      className={cn(
        'plaque-field',
        divided && 'plaque-field--divided',
        stretch && 'plaque-field--stretch',
        className,
      )}
      data-param-id={paramId}
    >
      <span className={labelClass} title={labelVariant === 'param' ? label : undefined}>
        {label}
      </span>
      {divided ? <span className="plaque-divider" aria-hidden="true" /> : null}
      <Input
        className="plaque-field__control"
        {...inputProps}
        id={controlId}
        name={controlName}
      />
    </label>
  );
}
