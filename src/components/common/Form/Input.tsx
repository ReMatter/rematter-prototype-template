import { TextField, Input as AriaInput } from 'react-aria-components'
import type { InputProps } from './types'

export const Input = ({
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
  className = '',
  name,
  style,
}: InputProps) => {
  return (
    <TextField
      value={value ?? ''}
      onChange={onChange}
      isDisabled={disabled}
      name={name}
      className={className}
    >
      <AriaInput
        type={type}
        placeholder={placeholder}
        className="entity-drawer-input"
        style={style}
      />
    </TextField>
  )
}
