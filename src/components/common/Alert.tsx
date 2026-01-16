import { useState } from 'react'
import type { ReactNode } from 'react'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  /** Type of alert */
  type?: AlertType
  /** Alert title */
  title?: ReactNode
  /** Alert message/description */
  message?: ReactNode
  /** Description (alias for message) */
  description?: ReactNode
  /** Whether to show icon */
  showIcon?: boolean
  /** Custom icon */
  icon?: ReactNode
  /** Whether the alert is closable */
  closable?: boolean
  /** Close button text */
  closeText?: ReactNode
  /** Callback when closed */
  onClose?: () => void
  /** Custom class name */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
  /** Banner mode (full width, no border-radius) */
  banner?: boolean
  /** Action buttons */
  action?: ReactNode
}

const icons: Record<AlertType, ReactNode> = {
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm0 3a1 1 0 100 2 1 1 0 000-2zm0 3a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm3.707 4.293a1 1 0 00-1.414 0L7 8.586 5.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a1 1 0 011 1v2a1 1 0 11-2 0V6a1 1 0 011-1zm0 6a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm0 3a1 1 0 00-1 1v3a1 1 0 102 0V5a1 1 0 00-1-1zm0 7a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  ),
}

export function Alert({
  type = 'info',
  title,
  message,
  description,
  showIcon = true,
  icon,
  closable = false,
  closeText,
  onClose,
  className,
  style,
  banner = false,
  action,
}: AlertProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  const content = description || message

  return (
    <div
      className={`alert alert-${type} ${banner ? 'alert-banner' : ''} ${className || ''}`}
      style={style}
      role="alert"
    >
      {showIcon && (
        <span className="alert-icon">
          {icon || icons[type]}
        </span>
      )}
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        {content && <div className="alert-description">{content}</div>}
      </div>
      {action && <div className="alert-action">{action}</div>}
      {closable && (
        <button className="alert-close" onClick={handleClose} aria-label="Close">
          {closeText || (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 1l10 10M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}
