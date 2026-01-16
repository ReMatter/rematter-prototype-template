import { useState, useMemo } from 'react'
import {
  ComboBox as AriaComboBox,
  Input,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
} from 'react-aria-components'
import type { SelectProps, SelectOption } from './types'

// Chevron down icon
const ChevronDownIcon = () => (
  <svg
    className="entity-drawer-combobox-icon"
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

// ComboBox uses the same props as Select for easy migration
export type ComboBoxProps = SelectProps

export const ComboBox = ({
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  options,
  className = '',
  name,
}: ComboBoxProps) => {
  const [filterText, setFilterText] = useState('')

  // Find selected option to display its label
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  )

  // Filter options based on typed text
  const filteredOptions = useMemo(() => {
    if (!filterText) return options
    const lower = filterText.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(lower))
  }, [options, filterText])

  const handleSelectionChange = (key: React.Key | null) => {
    if (key !== null) {
      onChange?.(key as string)
      setFilterText('')
    }
  }

  const handleInputChange = (value: string) => {
    setFilterText(value)
  }

  return (
    <AriaComboBox
      selectedKey={value ?? null}
      onSelectionChange={handleSelectionChange}
      inputValue={filterText || selectedOption?.label || ''}
      onInputChange={handleInputChange}
      isDisabled={disabled}
      name={name}
      className={`entity-drawer-combobox ${className}`}
      menuTrigger="focus"
    >
      <div className="entity-drawer-combobox-wrapper">
        <Input
          className="entity-drawer-combobox-input"
          placeholder={placeholder}
        />
        <Button className="entity-drawer-combobox-button">
          <ChevronDownIcon />
        </Button>
      </div>
      <Popover className="entity-drawer-select-popover">
        <ListBox
          items={filteredOptions}
          className="entity-drawer-combobox-listbox"
        >
          {(item: SelectOption) => (
            <ListBoxItem
              key={item.value}
              id={item.value}
              className="entity-drawer-select-option"
            >
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
        {filteredOptions.length === 0 && (
          <div className="entity-drawer-combobox-empty">No results found</div>
        )}
      </Popover>
    </AriaComboBox>
  )
}
