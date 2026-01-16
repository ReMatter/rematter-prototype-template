import { TextField, TextArea as AriaTextArea } from 'react-aria-components'
import type { TextAreaProps } from './types'

export const TextArea = ({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
  className = '',
  name,
}: TextAreaProps) => {
  return (
    <TextField
      value={value ?? ''}
      onChange={onChange}
      isDisabled={disabled}
      name={name}
      className={className}
    >
      <AriaTextArea
        placeholder={placeholder}
        rows={rows}
        className="entity-drawer-textarea"
      />
    </TextField>
  )
}
