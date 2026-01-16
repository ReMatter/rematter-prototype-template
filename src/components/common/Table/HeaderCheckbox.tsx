export interface HeaderCheckboxProps {
  /** Whether all items are selected */
  isSelected: boolean
  /** Whether some (but not all) items are selected */
  isIndeterminate: boolean
  /** Selection change handler */
  onChange: (isSelected: boolean) => void
  /** Accessible label */
  'aria-label'?: string
}

/**
 * Header checkbox for "select all" functionality.
 * Uses plain HTML checkbox (not React Aria) to avoid slot context requirements.
 * Supports indeterminate state for partial selection.
 */
export function HeaderCheckbox({
  isSelected,
  isIndeterminate,
  onChange,
  'aria-label': ariaLabel = 'Select all',
}: HeaderCheckboxProps) {
  // Handle click on the label/checkbox area directly
  // Browser's default label behavior doesn't always work when clicking child elements
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // When indeterminate or unchecked, select all; when checked, deselect all
    onChange(!isSelected)
  }

  return (
    <label className="data-table-checkbox" aria-label={ariaLabel} onClick={handleClick}>
      <input
        type="checkbox"
        checked={isSelected}
        ref={(el) => {
          if (el) el.indeterminate = isIndeterminate
        }}
        onChange={(e) => onChange(e.target.checked)}
        className="data-table-checkbox-input"
      />
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
    </label>
  )
}
