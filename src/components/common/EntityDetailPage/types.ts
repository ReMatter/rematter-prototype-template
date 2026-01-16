import type { ReactNode } from 'react'

// Tab configuration for entity detail pages
export interface TabConfig {
  key: string
  label: string
  badge?: number | string
  children: ReactNode
}

// Action button configuration
export interface ActionConfig {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  primary?: boolean
  confirm?: {
    title: string
    description: string
  }
}

// Status display configuration
export interface StatusConfig {
  label: string
  color: 'blue' | 'orange' | 'cyan' | 'green' | 'red' | 'gray'
}

// Progress configuration (optional, for orders with fulfillment tracking)
export interface ProgressConfig {
  percent: number
  label?: string // e.g., "49% fulfilled"
}

// Main shell component props
export interface EntityDetailPageProps {
  // Header configuration
  title: string // e.g., "Purchase Order"
  entityId: string // e.g., "#002345"
  subtitle?: string // e.g., "Created on Jun 2025 by Oliver Smith"
  backPath: string // e.g., "/purchase-orders"
  status: StatusConfig
  progress?: ProgressConfig
  actions?: ActionConfig[]

  // Tab configuration
  tabs: TabConfig[]
  defaultTab?: string
  onTabChange?: (tabKey: string) => void

  // Form state
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  onSave: () => void | Promise<void>
  onDiscard: () => void

  // Content
  children?: ReactNode
}

// Header component props
export interface EntityDetailHeaderProps {
  title: string
  entityId: string
  subtitle?: string
  backPath: string
  status: StatusConfig
  progress?: ProgressConfig
  actions?: ActionConfig[]
}

// Tabs component props
export interface EntityDetailTabsProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (tabKey: string) => void
}

// Footer component props
export interface EntityDetailFooterProps {
  isDirty: boolean
  isSaving: boolean
  onSave: () => void | Promise<void>
  onDiscard: () => void
}

// Form state management hook types
export interface UseEntityFormOptions<T> {
  initialData: T | null
  validate?: (data: T) => Record<string, string>
}

export interface UseEntityFormReturn<T> {
  formData: T
  originalData: T | null
  isDirty: boolean
  errors: Record<string, string>
  updateField: <K extends keyof T>(field: K, value: T[K]) => void
  updateNestedField: (path: string, value: unknown) => void
  setFormData: (data: T) => void
  resetForm: () => void
  validateForm: () => boolean
  clearError: (field: string) => void
}
