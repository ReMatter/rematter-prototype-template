import { Checkbox } from 'react-aria-components'

interface TableCheckboxProps {
  isSelected?: boolean
  isIndeterminate?: boolean
  onChange?: (isSelected: boolean) => void
  'aria-label'?: string
  slot?: string
}

export function TableCheckbox({
  isSelected,
  isIndeterminate,
  onChange,
  'aria-label': ariaLabel = 'Select',
  slot,
}: TableCheckboxProps) {
  // When using slot="selection", don't pass isSelected/isIndeterminate
  // as React Aria will control them through the slot context
  const checkboxProps = slot === 'selection'
    ? { slot, 'aria-label': ariaLabel, className: 'data-table-checkbox' }
    : {
        isSelected: isSelected ?? false,
        isIndeterminate: isIndeterminate ?? false,
        onChange,
        'aria-label': ariaLabel,
        className: 'data-table-checkbox'
      }

  return (
    <Checkbox {...checkboxProps}>
      {({ isSelected, isIndeterminate }) => (
        <span className="data-table-checkbox-box">
          {isIndeterminate ? (
            <span className="data-table-checkbox-indeterminate" />
          ) : isSelected ? (
            <svg
              className="data-table-checkbox-icon"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 6L5 8.5L9.5 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
      )}
    </Checkbox>
  )
}
