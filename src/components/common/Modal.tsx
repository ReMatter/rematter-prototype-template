import {
  Dialog,
  DialogTrigger,
  Modal as AriaModal,
  ModalOverlay,
  Heading,
} from 'react-aria-components'
import type { ReactNode } from 'react'
import { Button } from './Button'

export interface ModalProps {
  /** Whether the modal is open */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Modal title */
  title?: ReactNode
  /** Modal content */
  children?: ReactNode
  /** Footer content - if not provided, default OK/Cancel buttons are shown */
  footer?: ReactNode | null
  /** OK button text */
  okText?: string
  /** Cancel button text */
  cancelText?: string
  /** OK button callback */
  onOk?: () => void
  /** Cancel button callback */
  onCancel?: () => void
  /** Whether OK button is in loading state */
  confirmLoading?: boolean
  /** Whether OK button is disabled */
  okDisabled?: boolean
  /** Modal width */
  width?: number | string
  /** Whether to show close button in header */
  closable?: boolean
  /** Whether clicking mask closes modal */
  maskClosable?: boolean
  /** Additional class name */
  className?: string
  /** OK button variant */
  okButtonVariant?: 'primary' | 'danger'
}

export function Modal({
  open = false,
  onOpenChange,
  title,
  children,
  footer,
  okText = 'OK',
  cancelText = 'Cancel',
  onOk,
  onCancel,
  confirmLoading = false,
  okDisabled = false,
  width = 520,
  closable = true,
  maskClosable = true,
  className,
  okButtonVariant = 'primary',
}: ModalProps) {
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen)
    if (!isOpen) {
      onCancel?.()
    }
  }

  const handleOk = () => {
    onOk?.()
  }

  const handleCancel = () => {
    onOpenChange?.(false)
    onCancel?.()
  }

  const modalWidth = typeof width === 'number' ? `${width}px` : width

  const defaultFooter = (
    <div className="modal-footer">
      <Button variant="default" onPress={handleCancel}>
        {cancelText}
      </Button>
      <Button
        variant={okButtonVariant}
        onPress={handleOk}
        isDisabled={okDisabled || confirmLoading}
      >
        {confirmLoading ? 'Loading...' : okText}
      </Button>
    </div>
  )

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={handleOpenChange}
      isDismissable={maskClosable}
      className="modal-overlay"
    >
      <AriaModal
        className={`modal ${className || ''}`}
        style={{ width: modalWidth }}
      >
        <Dialog className="modal-dialog">
          {({ close }) => (
            <>
              {(title || closable) && (
                <div className="modal-header">
                  {title && (
                    <Heading slot="title" className="modal-title">
                      {title}
                    </Heading>
                  )}
                  {closable && (
                    <button
                      className="modal-close"
                      onClick={close}
                      aria-label="Close"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M1 1L13 13M1 13L13 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <div className="modal-body">{children}</div>
              {footer !== null && (footer || defaultFooter)}
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  )
}

// Re-export DialogTrigger for programmatic control
export { DialogTrigger }
