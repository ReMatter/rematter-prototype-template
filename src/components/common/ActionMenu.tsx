import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

export interface ActionMenuItem {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}

export interface ActionMenuProps {
  items: ActionMenuItem[]
}

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="5" r="2" fill="currentColor" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <circle cx="12" cy="19" r="2" fill="currentColor" />
  </svg>
)

export function ActionMenu({ items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{
    top?: number
    bottom?: number
    right: number
  }>({ right: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Filter out disabled items for display, but keep them for proper ordering
  const visibleItems = items.filter(item => !item.disabled)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
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

  // Calculate menu position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const menuHeight = Math.min(visibleItems.length * 36 + 8, 300) // Estimate menu height
      const padding = 8

      const spaceBelow = viewportHeight - rect.bottom - padding
      const spaceAbove = rect.top - padding

      if (spaceBelow >= menuHeight) {
        setPosition({
          top: rect.bottom + 2,
          bottom: undefined,
          right: viewportWidth - rect.right,
        })
      } else if (spaceAbove >= menuHeight) {
        setPosition({
          top: undefined,
          bottom: viewportHeight - rect.top + 2,
          right: viewportWidth - rect.right,
        })
      } else {
        // Open in direction with more space
        if (spaceBelow >= spaceAbove) {
          setPosition({
            top: rect.bottom + 2,
            bottom: undefined,
            right: viewportWidth - rect.right,
          })
        } else {
          setPosition({
            top: undefined,
            bottom: viewportHeight - rect.top + 2,
            right: viewportWidth - rect.right,
          })
        }
      }
    }
  }, [isOpen, visibleItems.length])

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick()
    setIsOpen(false)
  }

  // Don't render if no visible items
  if (visibleItems.length === 0) {
    return <span className="action-menu-placeholder">-</span>
  }

  return (
    <div className="action-menu">
      <button
        ref={buttonRef}
        className="action-menu-trigger"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreIcon />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="action-menu-dropdown"
          style={{
            position: 'fixed',
            top: position.top ?? 'auto',
            bottom: position.bottom ?? 'auto',
            right: position.right,
            left: 'auto',
          }}
        >
          {visibleItems.map((item) => (
            <button
              key={item.key}
              className={`action-menu-item ${item.danger ? 'danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                handleItemClick(item)
              }}
            >
              {item.icon && <span className="action-menu-item-icon">{item.icon}</span>}
              <span className="action-menu-item-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
