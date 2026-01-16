import { NumberField, Input as AriaInput, Group } from 'react-aria-components'
import type { NumberInputProps } from './types'

export const NumberInput = ({
  value,
  onChange,
  placeholder,
  disabled,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  className = '',
  name,
}: NumberInputProps) => {
  const handleChange = (newValue: number) => {
    onChange?.(newValue)
  }

  return (
    <NumberField
      value={value ?? undefined}
      onChange={handleChange}
      isDisabled={disabled}
      minValue={min}
      maxValue={max}
      step={step}
      name={name}
      className={className}
      formatOptions={prefix === '$' ? { style: 'currency', currency: 'USD' } : undefined}
    >
      <Group className={`entity-drawer-number-group${suffix ? ' entity-drawer-number-group--with-suffix' : ''}`}>
        {prefix && !prefix.includes('$') && (
          <span className="entity-drawer-number-prefix">{prefix}</span>
        )}
        <AriaInput
          placeholder={placeholder}
          className="entity-drawer-number-input"
        />
        {suffix && (
          <span className="entity-drawer-number-suffix">{suffix}</span>
        )}
      </Group>
    </NumberField>
  )
}
