import type { ReactNode } from 'react'
import type { Key, Selection, SortDescriptor } from 'react-aria-components'

export type { Key, Selection, SortDescriptor }

export interface BulkAction<T> {
  /** Unique key for the action */
  key: string
  /** Display label */
  label: string
  /** Optional icon */
  icon?: ReactNode
  /** Button variant style */
  variant?: 'default' | 'primary' | 'danger'
  /** Handler for simple actions */
  onAction?: (selectedRecords: T[], selectedKeys: Set<Key>) => void
  /** Options for dropdown actions (like Update Type) */
  options?: { label: string; value: string }[]
  /** Handler for dropdown option selection */
  onOptionSelect?: (value: string, selectedRecords: T[], selectedKeys: Set<Key>) => void
}

export type SortDirection = 'ascending' | 'descending'

export interface FilterOption {
  text: string
  value: string | number | boolean
}

export interface ColumnDef<T> {
  /** Unique key for the column */
  key: string
  /** Column header title */
  title: ReactNode
  /** Data field to access */
  dataIndex?: keyof T
  /** Custom render function */
  render?: (value: unknown, record: T, index: number) => ReactNode
  /** Column width in pixels or percentage */
  width?: number | string
  /** Whether column is sortable */
  sortable?: boolean
  /** Custom sort function */
  sorter?: (a: T, b: T) => number
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Whether this column is a row header for accessibility */
  isRowHeader?: boolean
  /** Filter options for column filtering */
  filters?: FilterOption[]
  /** Filter function */
  onFilter?: (value: unknown, record: T) => boolean
  /** Whether column content should be ellipsized */
  ellipsis?: boolean
}

export interface PaginationConfig {
  /** Current page (1-indexed) */
  current?: number
  /** Items per page */
  pageSize?: number
  /** Total items count (if not provided, uses data.length) */
  total?: number
  /** Page size options */
  pageSizeOptions?: number[]
  /** Show size changer */
  showSizeChanger?: boolean
  /** Show total */
  showTotal?: (total: number, range: [number, number]) => ReactNode
  /** Page change handler */
  onChange?: (page: number, pageSize: number) => void
}

export interface ColumnVisibility {
  [key: string]: boolean
}

export interface ColumnFilters {
  [columnKey: string]: unknown[]
}

export interface DataTableProps<T> {
  /** Data array to display */
  data: T[]
  /** Column definitions */
  columns: ColumnDef<T>[]
  /** Unique key field in data (defaults to 'id') */
  rowKey?: keyof T
  /** Table size variant */
  size?: 'default' | 'large'
  /** Loading state */
  loading?: boolean

  // Selection
  /** Selection mode */
  selectionMode?: 'none' | 'single' | 'multiple'
  /** Currently selected keys */
  selectedKeys?: Selection
  /** Selection change handler */
  onSelectionChange?: (keys: Selection) => void
  /** Disabled row keys */
  disabledKeys?: Iterable<Key>

  // Sorting
  /** Current sort descriptor */
  sortDescriptor?: SortDescriptor
  /** Sort change handler */
  onSortChange?: (descriptor: SortDescriptor) => void

  // Pagination
  /** Pagination config, false to disable */
  pagination?: false | PaginationConfig

  // Row interactions
  /** Row click handler */
  onRowClick?: (record: T) => void
  /** Row double-click handler */
  onRowDoubleClick?: (record: T) => void
  /** Row action handler (for keyboard/accessibility) */
  onRowAction?: (key: Key) => void

  // Column management
  /** Show column management toolbar */
  showColumnManager?: boolean
  /** Controlled column visibility */
  columnVisibility?: ColumnVisibility
  /** Column visibility change handler */
  onColumnVisibilityChange?: (visibility: ColumnVisibility) => void

  // Column filtering
  /** Controlled column filters */
  columnFilters?: ColumnFilters
  /** Column filters change handler */
  onColumnFiltersChange?: (filters: ColumnFilters) => void

  // Empty state
  /** Content to show when no data */
  emptyContent?: ReactNode

  // Styling
  className?: string
  /** Row className (can be function) */
  rowClassName?: string | ((record: T, index: number) => string)

  // Bulk actions
  /** Bulk actions for selected rows (only shown when selectionMode is 'multiple') */
  bulkActions?: BulkAction<T>[]
}
