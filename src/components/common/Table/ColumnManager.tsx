import { useState, useRef, useEffect, useCallback } from 'react'

interface ColumnItem {
  key: string
  title: string
  visible: boolean
}

interface ColumnManagerProps {
  columns: ColumnItem[]
  onChange: (columns: ColumnItem[]) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
}

// Icons
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const GripIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="6" r="1.5" fill="currentColor" />
    <circle cx="15" cy="6" r="1.5" fill="currentColor" />
    <circle cx="9" cy="12" r="1.5" fill="currentColor" />
    <circle cx="15" cy="12" r="1.5" fill="currentColor" />
    <circle cx="9" cy="18" r="1.5" fill="currentColor" />
    <circle cx="15" cy="18" r="1.5" fill="currentColor" />
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12l5 5L20 7"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function ColumnManager({ columns, onChange, onReorder }: ColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: number
    bottom?: number
    right: number
    maxHeight?: number
  }>({ right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const dropdownHeight = 400 // Estimated max height of dropdown
      const padding = 16 // Padding from viewport edge

      const spaceBelow = viewportHeight - rect.bottom - padding
      const spaceAbove = rect.top - padding

      // Determine if we should open upward or downward
      if (spaceBelow >= dropdownHeight) {
        // Enough space below - open downward
        setDropdownPosition({
          top: rect.bottom + 4,
          bottom: undefined,
          right: viewportWidth - rect.right,
          maxHeight: spaceBelow,
        })
      } else if (spaceAbove >= dropdownHeight) {
        // Not enough space below, but enough above - open upward
        setDropdownPosition({
          top: undefined,
          bottom: viewportHeight - rect.top + 4,
          right: viewportWidth - rect.right,
          maxHeight: spaceAbove,
        })
      } else {
        // Limited space both ways - open in direction with more space
        if (spaceBelow >= spaceAbove) {
          setDropdownPosition({
            top: rect.bottom + 4,
            bottom: undefined,
            right: viewportWidth - rect.right,
            maxHeight: spaceBelow,
          })
        } else {
          setDropdownPosition({
            top: undefined,
            bottom: viewportHeight - rect.top + 4,
            right: viewportWidth - rect.right,
            maxHeight: spaceAbove,
          })
        }
      }
    }
  }, [isOpen])

  const toggleColumn = (key: string) => {
    const updated = columns.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    )
    onChange(updated)
  }

  // Drag and drop handlers for reordering visible columns
  const handleDragStart = useCallback((e: React.DragEvent, key: string) => {
    setDraggedItem(key)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', key)
    // Add a slight delay to allow the drag image to be set
    const target = e.currentTarget as HTMLElement
    setTimeout(() => {
      target.classList.add('dragging')
    }, 0)
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('dragging')
    setDraggedItem(null)
    setDragOverItem(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, key: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedItem && key !== draggedItem) {
      setDragOverItem(key)
    }
  }, [draggedItem])

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetKey) return

    // Find indices in the full columns array (not filtered)
    const fromIndex = columns.findIndex((col) => col.key === draggedItem)
    const toIndex = columns.findIndex((col) => col.key === targetKey)

    if (fromIndex === -1 || toIndex === -1) return

    if (onReorder) {
      onReorder(fromIndex, toIndex)
    } else {
      // Default reorder behavior if no onReorder provided
      const newColumns = [...columns]
      const [removed] = newColumns.splice(fromIndex, 1)
      newColumns.splice(toIndex, 0, removed)
      onChange(newColumns)
    }

    setDraggedItem(null)
    setDragOverItem(null)
  }, [draggedItem, columns, onReorder, onChange])

  const filteredColumns = columns.filter((col) =>
    col.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const visibleColumns = filteredColumns.filter((col) => col.visible)
  const hiddenColumns = filteredColumns.filter((col) => !col.visible)

  return (
    <div className="column-manager">
      <button
        ref={buttonRef}
        className="column-manager-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <SettingsIcon />
        <span>Manage Columns</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="column-manager-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top ?? 'auto',
            bottom: dropdownPosition.bottom ?? 'auto',
            right: dropdownPosition.right,
            left: 'auto',
            maxHeight: dropdownPosition.maxHeight,
            overflowY: 'auto',
          }}
        >
          {/* Search input */}
          <div className="column-manager-search-wrapper">
            <div className="column-manager-search">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search column"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="column-manager-search-input"
              />
            </div>
          </div>

          {/* Visible columns section */}
          {visibleColumns.length > 0 && (
            <>
              <div className="column-manager-section-title">VISIBLE COLUMNS</div>
              <div className="column-manager-list">
                {visibleColumns.map((col) => (
                  <div
                    key={col.key}
                    className={`column-manager-item ${draggedItem === col.key ? 'dragging' : ''} ${dragOverItem === col.key ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, col.key)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.key)}
                  >
                    <span className="column-manager-grip" title="Drag to reorder">
                      <GripIcon />
                    </span>
                    <button
                      className="column-manager-checkbox checked"
                      onClick={() => toggleColumn(col.key)}
                      aria-checked={true}
                      role="checkbox"
                    >
                      <CheckIcon />
                    </button>
                    <span className="column-manager-label">{col.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Hidden columns section */}
          {hiddenColumns.length > 0 && (
            <>
              <div className="column-manager-section-title">HIDDEN COLUMNS</div>
              <div className="column-manager-list">
                {hiddenColumns.map((col) => (
                  <div key={col.key} className="column-manager-item hidden">
                    <span className="column-manager-grip">
                      <GripIcon />
                    </span>
                    <button
                      className="column-manager-checkbox"
                      onClick={() => toggleColumn(col.key)}
                      aria-checked={false}
                      role="checkbox"
                    >
                    </button>
                    <span className="column-manager-label">{col.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {filteredColumns.length === 0 && (
            <div className="column-manager-empty">No columns found</div>
          )}
        </div>
      )}
    </div>
  )
}
