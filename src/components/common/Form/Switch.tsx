import { Switch as AriaSwitch } from 'react-aria-components'
import type { ReactNode } from 'react'

export interface SwitchProps {
  /** Whether the switch is selected */
  isSelected?: boolean
  /** Default selection state (uncontrolled) */
  defaultSelected?: boolean
  /** Callback when selection changes */
  onChange?: (isSelected: boolean) => void
  /** Whether the switch is disabled */
  isDisabled?: boolean
  /** Label for checked state */
  checkedChildren?: ReactNode
  /** Label for unchecked state */
  unCheckedChildren?: ReactNode
  /** Additional class name */
  className?: string
  /** Name for form submission */
  name?: string
  /** Value for form submission */
  value?: string
}

export function Switch({
  isSelected,
  defaultSelected,
  onChange,
  isDisabled,
  checkedChildren,
  unCheckedChildren,
  className = '',
  name,
  value,
}: SwitchProps) {
  return (
    <AriaSwitch
      isSelected={isSelected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      className={`switch ${className}`}
      name={name}
      value={value}
    >
      <div className="switch-track">
        <span className="switch-thumb" />
      </div>
      {(checkedChildren || unCheckedChildren) && (
        <span className="switch-label">
          {isSelected ? checkedChildren : unCheckedChildren}
        </span>
      )}
    </AriaSwitch>
  )
}
