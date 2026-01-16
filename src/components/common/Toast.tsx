import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = `toast-${++toastId}`
    setToasts((prev) => [...prev, { id, type, message, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    addToast('info', message, duration)
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onRemove])

  const icons: Record<ToastType, ReactNode> = {
    success: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M13.333 4L6 11.333 2.667 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    error: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M12 4L4 12M4 4l8 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    warning: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 5.333V8M8 10.667h.007M6.86 2.573l-5.14 8.906a1.333 1.333 0 001.14 2.001h10.28a1.333 1.333 0 001.14-2.001l-5.14-8.906a1.333 1.333 0 00-2.28 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 10.667V8M8 5.333h.007M14.667 8A6.667 6.667 0 111.333 8a6.667 6.667 0 0113.334 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  }

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)} aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
