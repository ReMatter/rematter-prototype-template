import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
  Heading,
} from 'react-aria-components'
import type { ReactNode } from 'react'

export interface DrawerProps {
  /** Whether the drawer is open */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Drawer title */
  title?: ReactNode
  /** Extra content in header (right side) */
  extra?: ReactNode
  /** Drawer content */
  children?: ReactNode
  /** Footer content */
  footer?: ReactNode | null
  /** Drawer width */
  width?: number | string
  /** Whether to show close button in header */
  closable?: boolean
  /** Whether clicking mask closes drawer */
  maskClosable?: boolean
  /** Additional class name */
  className?: string
  /** Placement of the drawer */
  placement?: 'right' | 'left'
}

export function Drawer({
  open = false,
  onOpenChange,
  title,
  extra,
  children,
  footer,
  width = 600,
  closable = true,
  maskClosable = true,
  className,
  placement = 'right',
}: DrawerProps) {
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange?.(isOpen)
  }

  const drawerWidth = typeof width === 'number' ? `${width}px` : width

  const placementStyles = placement === 'left'
    ? { left: 0, right: 'auto' }
    : { right: 0, left: 'auto' }

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={handleOpenChange}
      isDismissable={maskClosable}
      className="drawer-overlay"
    >
      <AriaModal
        className={`drawer ${className || ''}`}
        style={{ width: drawerWidth, ...placementStyles }}
      >
        <Dialog className="drawer-dialog">
          {({ close }) => (
            <>
              {(title || closable || extra) && (
                <div className="drawer-header">
                  <div className="drawer-header-left">
                    {closable && (
                      <button
                        className="drawer-close"
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
                    {title && (
                      <Heading slot="title" className="drawer-title">
                        {title}
                      </Heading>
                    )}
                  </div>
                  {extra && <div className="drawer-header-extra">{extra}</div>}
                </div>
              )}
              <div className="drawer-body">{children}</div>
              {footer !== null && footer && (
                <div className="drawer-footer">{footer}</div>
              )}
            </>
          )}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  )
}
