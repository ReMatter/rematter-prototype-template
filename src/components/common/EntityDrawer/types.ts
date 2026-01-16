import type { ReactNode } from 'react'

export interface StepConfig {
  key: string
  title: string
}

export interface EntityDrawerProps<T = unknown> {
  /** Whether the drawer is visible */
  open: boolean
  /** Callback when drawer is closed */
  onClose: () => void
  /** Title displayed in the drawer header */
  title: string
  /** Entity being edited (null/undefined for create mode) */
  entity?: T | null
  /** Callback when form is submitted */
  onSave: (values: Partial<T>) => void

  // Multi-step configuration (optional)
  /** Step configuration for multi-step forms */
  steps?: StepConfig[]
  /** Current step index (0-based) */
  currentStep?: number
  /** Callback when step changes */
  onStepChange?: (step: number) => void

  /** Form content */
  children: ReactNode
  /** Custom footer (uses default if not provided) */
  footer?: ReactNode
  /** Text for the save/next button */
  saveText?: string
  /** Drawer width (default: 600) */
  width?: number
  /** Whether to show loading state on save button */
  loading?: boolean
}

export interface StepIndicatorProps {
  steps: StepConfig[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export interface FormSectionProps {
  /** Section title */
  title: string
  /** Section content */
  children: ReactNode
  /** Optional description below title */
  description?: string
}

export interface DrawerFooterProps {
  onSave: () => void
  saveText?: string
  loading?: boolean
  /** For multi-step: show Back button */
  showBack?: boolean
  onBack?: () => void
  /** Disable the save button */
  saveDisabled?: boolean
}
