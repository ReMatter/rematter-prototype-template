import { useState, cloneElement, isValidElement } from 'react'
import type { ReactNode, ReactElement } from 'react'
import {
  DialogTrigger,
  Popover,
  Dialog,
  Heading,
} from 'react-aria-components'
import { Button } from './Button'

export interface PopconfirmProps {
  /** The title of the confirmation box */
  title?: ReactNode
  /** Description text */
  description?: ReactNode
  /** Text of the Confirm button */
  okText?: string
  /** Text of the Cancel button */
  cancelText?: string
  /** Button type of the Confirm button */
  okType?: 'primary' | 'danger'
  /** Whether to show the Cancel button */
  showCancel?: boolean
  /** Callback when confirmed */
  onConfirm?: () => void | Promise<void>
  /** Callback when cancelled */
  onCancel?: () => void
  /** Custom icon */
  icon?: ReactNode
  /** Whether the confirm button is loading */
  confirmLoading?: boolean
  /** Whether the popconfirm is disabled */
  disabled?: boolean
  /** The element that triggers the popconfirm */
  children: ReactElement
  /** Placement of the popover */
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const defaultIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#faad14' }}>
    <path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5a1 1 0 011 1v2a1 1 0 11-2 0V6a1 1 0 011-1zm0 6a1 1 0 100 2 1 1 0 000-2z" />
  </svg>
)

export function Popconfirm({
  title,
  description,
  okText = 'Yes',
  cancelText = 'No',
  okType = 'primary',
  showCancel = true,
  onConfirm,
  onCancel,
  icon = defaultIcon,
  confirmLoading = false,
  disabled = false,
  children,
  placement = 'top',
}: PopconfirmProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (onConfirm) {
      const result = onConfirm()
      if (result instanceof Promise) {
        setLoading(true)
        try {
          await result
          setIsOpen(false)
        } finally {
          setLoading(false)
        }
      } else {
        setIsOpen(false)
      }
    } else {
      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setIsOpen(false)
  }

  // Clone the child element to add the click handler
  const triggerElement = isValidElement(children)
    ? cloneElement(children as ReactElement<{ onClick?: () => void }>, {
        onClick: () => {
          if (!disabled) {
            setIsOpen(true)
          }
        },
      })
    : children

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      {triggerElement}
      <Popover
        placement={placement}
        className="popconfirm-popover"
      >
        <Dialog className="popconfirm-dialog">
          <div className="popconfirm-content">
            <div className="popconfirm-message">
              {icon && <span className="popconfirm-icon">{icon}</span>}
              <div className="popconfirm-text">
                {title && <Heading slot="title" className="popconfirm-title">{title}</Heading>}
                {description && <div className="popconfirm-description">{description}</div>}
              </div>
            </div>
            <div className="popconfirm-buttons">
              {showCancel && (
                <Button size="small" onPress={handleCancel}>
                  {cancelText}
                </Button>
              )}
              <Button
                size="small"
                variant={okType}
                onPress={handleConfirm}
                isDisabled={loading || confirmLoading}
              >
                {(loading || confirmLoading) ? 'Loading...' : okText}
              </Button>
            </div>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
