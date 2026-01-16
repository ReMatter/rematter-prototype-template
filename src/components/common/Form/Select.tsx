import {
  Select as AriaSelect,
  SelectValue,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
} from 'react-aria-components'
import type { SelectProps } from './types'

// Chevron down icon
const ChevronDownIcon = () => (
  <svg
    className="entity-drawer-select-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export const Select = ({
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  options,
  className = '',
  name,
}: SelectProps) => {
  return (
    <AriaSelect
      selectedKey={value ?? null}
      onSelectionChange={(key) => onChange?.(key as string)}
      isDisabled={disabled}
      name={name}
      className={className}
      placeholder={placeholder}
    >
      <Button className="entity-drawer-select">
        <SelectValue className="entity-drawer-select-value">
          {({ isPlaceholder, selectedText }) => (
            <span className={isPlaceholder ? 'placeholder' : ''}>
              {isPlaceholder ? placeholder : selectedText}
            </span>
          )}
        </SelectValue>
        <ChevronDownIcon />
      </Button>
      <Popover className="entity-drawer-select-popover">
        <ListBox>
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              className="entity-drawer-select-option"
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  )
}
