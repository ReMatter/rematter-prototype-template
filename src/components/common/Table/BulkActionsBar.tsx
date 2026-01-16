import { useState, useEffect, useRef } from 'react'
import type { BulkAction, Key } from './types'

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export interface BulkActionsBarProps<T> {
  /** Number of selected items */
  selectedCount: number
  /** The actual selected records */
  selectedRecords: T[]
  /** Set of selected keys */
  selectedKeys: Set<Key>
  /** Array of bulk actions to display */
  actions: BulkAction<T>[]
  /** Handler to clear selection */
  onClearSelection: () => void
  /** Optional: Don't auto-clear selection after action (default: true = auto-clear) */
  autoClearSelection?: boolean
}

export function BulkActionsBar<T>({
  selectedCount,
  selectedRecords,
  selectedKeys,
  actions,
  onClearSelection,
  autoClearSelection = true,
}: BulkActionsBarProps<T>) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdown])

  const handleAction = (action: BulkAction<T>) => {
    if (action.onAction) {
      action.onAction(selectedRecords, selectedKeys)
      if (autoClearSelection) {
        onClearSelection()
      }
    }
  }

  const handleOptionSelect = (action: BulkAction<T>, value: string) => {
    if (action.onOptionSelect) {
      action.onOptionSelect(value, selectedRecords, selectedKeys)
      if (autoClearSelection) {
        onClearSelection()
      }
    }
    setOpenDropdown(null)
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="data-table-bulk-actions">
      <span className="data-table-bulk-actions-count">{selectedCount}</span>
      <span className="data-table-bulk-actions-label">selected</span>
      <div className="data-table-bulk-actions-divider" />
      <div className="data-table-bulk-actions-buttons" ref={dropdownRef}>
        {actions.map((action) => {
          const hasDropdown = action.options && action.options.length > 0
          const isOpen = openDropdown === action.key
          const variantClass = action.variant === 'primary'
            ? 'data-table-bulk-action-btn-primary'
            : action.variant === 'danger'
            ? 'data-table-bulk-action-btn-danger'
            : ''

          if (hasDropdown) {
            return (
              <div key={action.key} className="data-table-bulk-action-dropdown-wrapper">
                <button
                  className={`data-table-bulk-action-btn ${variantClass}`}
                  onClick={() => setOpenDropdown(isOpen ? null : action.key)}
                >
                  {action.icon}
                  <span>{action.label}</span>
                  <ChevronDownIcon />
                </button>
                {isOpen && (
                  <div className="data-table-bulk-action-dropdown">
                    {action.options!.map((option) => (
                      <button
                        key={option.value}
                        className="data-table-bulk-action-dropdown-item"
                        onClick={() => handleOptionSelect(action, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <button
              key={action.key}
              className={`data-table-bulk-action-btn ${variantClass}`}
              onClick={() => handleAction(action)}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
      <button
        className="data-table-bulk-actions-close"
        onClick={onClearSelection}
        aria-label="Clear selection"
      >
        <CloseIcon />
      </button>
    </div>
  )
}
