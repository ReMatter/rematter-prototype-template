import type { ReactNode } from 'react'
import type { BulkAction, Key } from './types'

/**
 * Factory function options for creating bulk actions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface BulkActionFactoryOptions<_T> {
  /** Custom icon for the action */
  icon?: ReactNode
  /** Override the default label */
  label?: string
  /** Confirmation message (if provided, will be passed to handler) */
  confirmMessage?: string
}

/**
 * Creates a simple bulk action
 */
export function createBulkAction<T>(
  key: string,
  label: string,
  onAction: (records: T[], keys: Set<Key>) => void | Promise<void>,
  options?: {
    icon?: ReactNode
    variant?: 'default' | 'primary' | 'danger'
  }
): BulkAction<T> {
  return {
    key,
    label,
    icon: options?.icon,
    variant: options?.variant ?? 'default',
    onAction,
  }
}

/**
 * Creates an "Activate" action for entities with isActive field
 */
export function createActivateAction<T extends { id: string | number }>(
  onActivate: (records: T[], keys: Set<Key>) => void | Promise<void>,
  options?: BulkActionFactoryOptions<T>
): BulkAction<T> {
  return {
    key: 'activate',
    label: options?.label ?? 'Activate',
    icon: options?.icon,
    variant: 'default',
    onAction: onActivate,
  }
}

/**
 * Creates a "Deactivate" action for entities with isActive field
 */
export function createDeactivateAction<T extends { id: string | number }>(
  onDeactivate: (records: T[], keys: Set<Key>) => void | Promise<void>,
  options?: BulkActionFactoryOptions<T>
): BulkAction<T> {
  return {
    key: 'deactivate',
    label: options?.label ?? 'Deactivate',
    icon: options?.icon,
    variant: 'default',
    onAction: onDeactivate,
  }
}

/**
 * Creates a "Delete" action with danger styling
 */
export function createDeleteAction<T extends { id: string | number }>(
  onDelete: (records: T[], keys: Set<Key>) => void | Promise<void>,
  options?: BulkActionFactoryOptions<T>
): BulkAction<T> {
  return {
    key: 'delete',
    label: options?.label ?? 'Delete',
    icon: options?.icon,
    variant: 'danger',
    onAction: onDelete,
  }
}

/**
 * Creates a dropdown action for changing a field value
 * Useful for type/category/status changes
 */
export function createDropdownAction<T extends { id: string | number }>(
  key: string,
  label: string,
  options: { label: string; value: string }[],
  onOptionSelect: (value: string, records: T[], keys: Set<Key>) => void | Promise<void>,
  factoryOptions?: {
    icon?: ReactNode
    variant?: 'default' | 'primary' | 'danger'
  }
): BulkAction<T> {
  return {
    key,
    label,
    icon: factoryOptions?.icon,
    variant: factoryOptions?.variant ?? 'default',
    options,
    onOptionSelect,
  }
}

/**
 * Creates a status transition action with predefined status options
 * Common for entities with workflow statuses
 */
export function createStatusAction<T extends { id: string | number }>(
  statusOptions: { label: string; value: string }[],
  onStatusChange: (status: string, records: T[], keys: Set<Key>) => void | Promise<void>,
  options?: BulkActionFactoryOptions<T>
): BulkAction<T> {
  return {
    key: 'update-status',
    label: options?.label ?? 'Update Status',
    icon: options?.icon,
    variant: 'default',
    options: statusOptions,
    onOptionSelect: onStatusChange,
  }
}

/**
 * Common status options for order-like entities
 */
export const ORDER_STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Closed', value: 'closed' },
] as const

/**
 * Common status options for quote entities
 */
export const QUOTE_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
] as const

/**
 * Common status options for load entities
 */
export const LOAD_STATUS_OPTIONS = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Picked Up', value: 'picked_up' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
] as const

/**
 * Common status options for invoice entities
 */
export const INVOICE_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Partial', value: 'partial' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

/**
 * Account type options
 */
export const ACCOUNT_TYPE_OPTIONS = [
  { label: 'Customer', value: 'customer' },
  { label: 'Supplier', value: 'supplier' },
  { label: 'Carrier', value: 'carrier' },
] as const
