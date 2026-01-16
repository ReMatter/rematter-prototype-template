import type { ReactNode } from 'react'

// Base line item interface - entities can extend this
export interface BaseLineItem {
  id: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalPrice: number
}

// Column types for the table
export type LineItemColumnType =
  | 'select'      // Dropdown select (commodity, product, etc.)
  | 'unit'        // Unit selector (lb, kg, ton, ea)
  | 'price'       // Price input with $ prefix
  | 'quantity'    // Quantity/weight input with unit suffix
  | 'total'       // Calculated total display (read-only)
  | 'custom'      // Custom render function

export interface SelectOption {
  value: string
  label: string
}

export interface LineItemColumn<T extends BaseLineItem = BaseLineItem> {
  key: string
  header: string
  type: LineItemColumnType
  width?: string  // CSS grid width (e.g., '3fr', '1fr', '120px')

  // For 'select' type
  options?: SelectOption[]
  placeholder?: string

  // For 'quantity' type - which field to use for the unit suffix
  unitField?: keyof T

  // For mapping to item fields
  field?: keyof T

  // For 'custom' type
  render?: (item: T, index: number) => ReactNode
}

export interface LineItemsTableProps<T extends BaseLineItem = BaseLineItem> {
  // Data
  items: T[]
  columns: LineItemColumn<T>[]

  // Options for select columns (keyed by column key)
  selectOptions?: Record<string, SelectOption[]>

  // Unit options
  unitOptions?: SelectOption[]

  // Event handlers (optional when readOnly)
  onAdd?: () => void
  onChange?: (index: number, field: keyof T, value: unknown) => void
  onRemove?: (index: number) => void

  // Read-only mode (no editing, no add/remove)
  readOnly?: boolean

  // Weighing toggle
  showWeighingToggle?: boolean
  usePricingUnitForWeighing?: boolean
  onToggleWeighingUnit?: () => void

  // Labels
  title: string
  itemLabel?: string  // e.g., "Commodity", "Line Item", "Product"
  addButtonLabel?: string
  emptyMessage?: string

  // Footer totals
  showFooterTotals?: boolean
  totalWeight?: number
  totalQuantity?: number
  subtotal?: number
  weightItemCount?: number
  quantityItemCount?: number
}

// Unit conversion types
export type WeightUnit = 'LB' | 'KG' | 'TON'
export type QuantityUnit = 'EA'
export type UnitType = WeightUnit | QuantityUnit

export const WEIGHT_UNITS: WeightUnit[] = ['LB', 'KG', 'TON']
export const QUANTITY_UNITS: QuantityUnit[] = ['EA']
export const BASE_WEIGHT_UNIT: WeightUnit = 'LB'

// Default unit options
export const DEFAULT_UNIT_OPTIONS: SelectOption[] = [
  { value: 'LB', label: 'lb' },
  { value: 'EA', label: 'ea' },
  { value: 'KG', label: 'kg' },
  { value: 'TON', label: 'ton' },
]
