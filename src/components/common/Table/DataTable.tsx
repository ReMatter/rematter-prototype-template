import { useState, useMemo, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import {
  Table,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
} from 'react-aria-components'
import { SortIcon } from './SortIcon'
import { TablePagination } from './TablePagination'
import { ColumnManager } from './ColumnManager'
import { TableCheckbox } from './TableCheckbox'
import { HeaderCheckbox } from './HeaderCheckbox'
import { BulkActionsBar } from './BulkActionsBar'
import type { DataTableProps, ColumnDef, ColumnVisibility, ColumnFilters, SortDescriptor, Key, Selection } from './types'

// Context for header checkbox - provides callback to trigger table re-render
interface SelectionContextValue {
  visibleKeys: Key[]
  allKeys: Key[]
  selectedKeys: Selection
  onHeaderCheckboxClick: (isSelected: boolean) => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

// Header checkbox component that reads from context
function HeaderCheckboxCell() {
  const ctx = useContext(SelectionContext)
  if (!ctx) return null

  const { visibleKeys, selectedKeys, onHeaderCheckboxClick } = ctx

  // Compute selection state
  let selectedCount = 0
  for (const key of visibleKeys) {
    if (selectedKeys === 'all' || (selectedKeys instanceof Set && selectedKeys.has(key))) {
      selectedCount++
    }
  }

  const isAllSelected = visibleKeys.length > 0 && selectedCount === visibleKeys.length
  const isSomeSelected = selectedCount > 0 && selectedCount < visibleKeys.length

  return (
    <div className="data-table-column-content data-table-column-checkbox-content">
      <HeaderCheckbox
        isSelected={isAllSelected}
        isIndeterminate={isSomeSelected}
        onChange={onHeaderCheckboxClick}
      />
    </div>
  )
}

export function DataTable<T extends object>({
  data,
  columns,
  rowKey = 'id' as keyof T,
  size = 'default',
  loading = false,
  selectionMode = 'none',
  selectedKeys,
  onSelectionChange,
  disabledKeys,
  sortDescriptor: controlledSortDescriptor,
  onSortChange,
  pagination,
  onRowClick,
  onRowDoubleClick,
  onRowAction,
  showColumnManager = false,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  emptyContent = 'No data',
  className,
  rowClassName,
  bulkActions,
}: DataTableProps<T>) {
  // Internal sort state if not controlled
  const [internalSortDescriptor, setInternalSortDescriptor] = useState<SortDescriptor | undefined>()
  const sortDescriptor = controlledSortDescriptor ?? internalSortDescriptor

  // Internal pagination state
  const [currentPage, setCurrentPage] = useState(pagination ? pagination.current ?? 1 : 1)
  const [pageSize, setPageSize] = useState(pagination ? pagination.pageSize ?? 10 : 10)

  // Filter state for column filters (supports controlled mode)
  const [internalActiveFilters, setInternalActiveFilters] = useState<ColumnFilters>({})
  const activeFilters = controlledColumnFilters ?? internalActiveFilters

  // Internal column visibility state if not controlled
  // Note: We don't pre-populate the state - undefined means visible (default)
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<ColumnVisibility>({})
  const columnVisibility = controlledColumnVisibility ?? internalColumnVisibility

  // Internal column order state - array of column keys in desired order
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map((col) => col.key))

  // Column pinning state - tracks which columns are pinned left or right
  const [pinnedColumns, setPinnedColumns] = useState<{ left: string[]; right: string[] }>({ left: [], right: [] })

  // Internal selection state if not controlled
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Selection>(new Set())
  const effectiveSelectedKeys = selectedKeys ?? internalSelectedKeys

  // Counter to force table re-render when header checkbox is clicked
  // This is needed because React Aria's Column caches its render children
  const [headerCheckboxVersion, setHeaderCheckboxVersion] = useState(0)

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      if (onSelectionChange) {
        onSelectionChange(keys)
      } else {
        setInternalSelectedKeys(keys)
      }
    },
    [onSelectionChange]
  )

  // Update column order when columns prop changes
  // Reset to new column order when columns change significantly (not just adding/removing a few)
  useEffect(() => {
    setColumnOrder((prevOrder) => {
      const newKeys = columns.map((col) => col.key)
      const existingKeys = prevOrder.filter((key) => newKeys.includes(key))
      const addedKeys = newKeys.filter((key) => !prevOrder.includes(key))

      // If more than half of the columns are new, reset to the provided order
      // This handles view switches where column sets are different
      if (addedKeys.length > newKeys.length / 2 || existingKeys.length < newKeys.length / 2) {
        return newKeys
      }

      // Otherwise, keep existing order and add new columns at the end
      return [...existingKeys, ...addedKeys]
    })
  }, [columns])

  // Handle column visibility change
  const handleColumnVisibilityChange = useCallback(
    (visibility: ColumnVisibility) => {
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(visibility)
      } else {
        setInternalColumnVisibility(visibility)
      }
    },
    [onColumnVisibilityChange]
  )

  // Handle column reorder
  const handleColumnReorder = useCallback((fromIndex: number, toIndex: number) => {
    setColumnOrder((prevOrder) => {
      const newOrder = [...prevOrder]
      const [removed] = newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, removed)
      return newOrder
    })
  }, [])

  // Compute ordered columns (respects order, then filters by visibility)
  const orderedColumns = useMemo(() => {
    // Create a map for O(1) lookup
    const columnMap = new Map(columns.map((col) => [col.key, col]))
    // Return columns in the specified order
    return columnOrder
      .map((key) => columnMap.get(key))
      .filter((col): col is ColumnDef<T> => col !== undefined)
  }, [columns, columnOrder])

  // Compute visible columns (filtered from ordered columns)
  const visibleColumns = useMemo(() => {
    return orderedColumns.filter((col) => columnVisibility[col.key] !== false)
  }, [orderedColumns, columnVisibility])

  // Column manager items for the ColumnManager component (uses orderedColumns to reflect current order)
  const columnManagerItems = useMemo(() => {
    return orderedColumns.map((col) => ({
      key: col.key,
      title: typeof col.title === 'string' ? col.title : col.key,
      visible: columnVisibility[col.key] !== false,
    }))
  }, [orderedColumns, columnVisibility])

  // Handle column manager change
  const handleColumnManagerChange = useCallback(
    (items: { key: string; title: string; visible: boolean }[]) => {
      const newVisibility: ColumnVisibility = {}
      items.forEach((item) => {
        newVisibility[item.key] = item.visible
      })
      handleColumnVisibilityChange(newVisibility)
    },
    [handleColumnVisibilityChange]
  )

  // Handle moving a column left (in visible column order)
  const handleMoveColumnLeft = useCallback((columnKey: string) => {
    setColumnOrder((prevOrder) => {
      const visibleOrder = prevOrder.filter((key) => columnVisibility[key] !== false)
      const visibleIndex = visibleOrder.indexOf(columnKey)
      if (visibleIndex <= 0) return prevOrder

      // Find the key of the column to swap with
      const swapWithKey = visibleOrder[visibleIndex - 1]
      const fromIndex = prevOrder.indexOf(columnKey)
      const toIndex = prevOrder.indexOf(swapWithKey)

      const newOrder = [...prevOrder]
      newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, columnKey)
      return newOrder
    })
  }, [columnVisibility])

  // Handle moving a column right (in visible column order)
  const handleMoveColumnRight = useCallback((columnKey: string) => {
    setColumnOrder((prevOrder) => {
      const visibleOrder = prevOrder.filter((key) => columnVisibility[key] !== false)
      const visibleIndex = visibleOrder.indexOf(columnKey)
      if (visibleIndex < 0 || visibleIndex >= visibleOrder.length - 1) return prevOrder

      // Find the key of the column to swap with
      const swapWithKey = visibleOrder[visibleIndex + 1]
      const fromIndex = prevOrder.indexOf(columnKey)
      const toIndex = prevOrder.indexOf(swapWithKey)

      const newOrder = [...prevOrder]
      newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex + (toIndex > fromIndex ? 0 : 1), 0, columnKey)
      return newOrder
    })
  }, [columnVisibility])

  // Handle making a column the first visible column
  const handleMakeColumnFirst = useCallback((columnKey: string) => {
    setColumnOrder((prevOrder) => {
      const visibleOrder = prevOrder.filter((key) => columnVisibility[key] !== false)
      if (visibleOrder[0] === columnKey) return prevOrder

      // Find first visible column's position and move this column before it
      const firstVisibleKey = visibleOrder[0]
      const fromIndex = prevOrder.indexOf(columnKey)
      const toIndex = prevOrder.indexOf(firstVisibleKey)

      const newOrder = [...prevOrder]
      newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, columnKey)
      return newOrder
    })
  }, [columnVisibility])

  // Handle making a column the last visible column
  const handleMakeColumnLast = useCallback((columnKey: string) => {
    setColumnOrder((prevOrder) => {
      const visibleOrder = prevOrder.filter((key) => columnVisibility[key] !== false)
      if (visibleOrder[visibleOrder.length - 1] === columnKey) return prevOrder

      // Find last visible column's position and move this column after it
      const lastVisibleKey = visibleOrder[visibleOrder.length - 1]
      const fromIndex = prevOrder.indexOf(columnKey)
      const toIndex = prevOrder.indexOf(lastVisibleKey)

      const newOrder = [...prevOrder]
      newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex + (toIndex >= fromIndex ? 0 : 1), 0, columnKey)
      return newOrder
    })
  }, [columnVisibility])

  // Handle hiding a column
  const handleHideColumn = useCallback((columnKey: string) => {
    const newVisibility = { ...columnVisibility, [columnKey]: false }
    handleColumnVisibilityChange(newVisibility)
  }, [columnVisibility, handleColumnVisibilityChange])

  // Handle pinning a column to the left
  const handlePinColumnLeft = useCallback((columnKey: string) => {
    setPinnedColumns((prev) => {
      // Remove from right if pinned there
      const newRight = prev.right.filter((key) => key !== columnKey)
      // Add to left if not already there
      const newLeft = prev.left.includes(columnKey) ? prev.left : [...prev.left, columnKey]
      return { left: newLeft, right: newRight }
    })
  }, [])

  // Handle pinning a column to the right
  const handlePinColumnRight = useCallback((columnKey: string) => {
    setPinnedColumns((prev) => {
      // Remove from left if pinned there
      const newLeft = prev.left.filter((key) => key !== columnKey)
      // Add to right if not already there
      const newRight = prev.right.includes(columnKey) ? prev.right : [...prev.right, columnKey]
      return { left: newLeft, right: newRight }
    })
  }, [])

  // Handle unpinning a column
  const handleUnpinColumn = useCallback((columnKey: string) => {
    setPinnedColumns((prev) => ({
      left: prev.left.filter((key) => key !== columnKey),
      right: prev.right.filter((key) => key !== columnKey),
    }))
  }, [])

  // Apply filters
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply column filters
    Object.entries(activeFilters).forEach(([columnKey, filterValues]) => {
      if (filterValues.length === 0) return

      const column = columns.find((c) => c.key === columnKey)
      if (!column?.onFilter) return

      result = result.filter((record) =>
        filterValues.some((value) => column.onFilter!(value, record))
      )
    })

    return result
  }, [data, activeFilters, columns])

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortDescriptor?.column) return filteredData

    const column = columns.find((c) => c.key === sortDescriptor.column)
    if (!column) return filteredData

    const sorted = [...filteredData].sort((a, b) => {
      // Use custom sorter if provided
      if (column.sorter) {
        const result = column.sorter(a, b)
        return sortDescriptor.direction === 'descending' ? -result : result
      }

      // Default sort by dataIndex
      if (column.dataIndex) {
        const aVal = a[column.dataIndex]
        const bVal = b[column.dataIndex]

        let result = 0
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          result = aVal.localeCompare(bVal)
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          result = aVal - bVal
        } else {
          result = String(aVal ?? '').localeCompare(String(bVal ?? ''))
        }

        return sortDescriptor.direction === 'descending' ? -result : result
      }

      return 0
    })

    return sorted
  }, [filteredData, sortDescriptor, columns])

  // Apply pagination
  const paginatedData = useMemo(() => {
    if (pagination === false) return sortedData

    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, pagination, currentPage, pageSize])

  // Handle sort change
  const handleSortChange = useCallback(
    (descriptor: SortDescriptor) => {
      if (onSortChange) {
        onSortChange(descriptor)
      } else {
        setInternalSortDescriptor(descriptor)
      }
    },
    [onSortChange]
  )

  // Handle pagination change
  const handlePaginationChange = useCallback(
    (page: number, size: number) => {
      setCurrentPage(page)
      setPageSize(size)
      if (typeof pagination === 'object' && pagination?.onChange) {
        pagination.onChange(page, size)
      }
    },
    [pagination]
  )

  // Handle row action (click, enter key)
  const handleRowAction = useCallback(
    (key: Key) => {
      if (onRowAction) {
        onRowAction(key)
      } else if (onRowClick) {
        const record = data.find((item) => String(item[rowKey]) === String(key))
        if (record) {
          onRowClick(record)
        }
      }
    },
    [onRowAction, onRowClick, data, rowKey]
  )

  // Handle filter change
  const handleFilterChange = useCallback((columnKey: string, values: unknown[]) => {
    const newFilters = {
      ...activeFilters,
      [columnKey]: values,
    }
    if (onColumnFiltersChange) {
      onColumnFiltersChange(newFilters)
    } else {
      setInternalActiveFilters(newFilters)
    }
    setCurrentPage(1) // Reset to first page when filtering
  }, [activeFilters, onColumnFiltersChange])

  // Get row key
  const getRowKey = useCallback(
    (record: T): Key => String(record[rowKey]),
    [rowKey]
  )

  // Get row class name
  const getRowClassName = useCallback(
    (record: T, index: number): string => {
      const base = 'data-table-row'
      const sizeClass = size === 'large' ? 'data-table-row-large' : ''
      const custom =
        typeof rowClassName === 'function' ? rowClassName(record, index) : rowClassName ?? ''
      return `${base} ${sizeClass} ${custom}`.trim()
    },
    [size, rowClassName]
  )

  const hasClickHandler = Boolean(onRowClick || onRowDoubleClick || onRowAction)

  // Transform visible columns to have id property for React Aria
  const columnsWithId = useMemo(() => {
    const cols = visibleColumns.map((col) => ({
      ...col,
      id: col.key,
    }))

    // Add checkbox column when selectionMode is 'multiple'
    if (selectionMode === 'multiple') {
      const checkboxColumn: ColumnDef<T> & { id: string } = {
        key: '__selection__',
        id: '__selection__',
        title: '',
        width: 50,
      }
      return [checkboxColumn, ...cols]
    }

    return cols
  }, [visibleColumns, selectionMode])

  // Compute pinning styles for each column (header and cell styles separate)
  const columnPinStyles = useMemo(() => {
    const headerStyles: Record<string, React.CSSProperties> = {}
    const cellStyles: Record<string, React.CSSProperties> = {}

    // Calculate left offsets for left-pinned columns
    let leftOffset = 0
    for (const col of columnsWithId) {
      if (pinnedColumns.left.includes(col.key)) {
        const baseStyle = {
          position: 'sticky' as const,
          left: leftOffset,
          zIndex: 2,
        }
        headerStyles[col.key] = {
          ...baseStyle,
          zIndex: 3,
        }
        cellStyles[col.key] = {
          ...baseStyle,
          backgroundColor: 'var(--color-bg-container)',
        }
        // Estimate width - use defined width or default
        const width = typeof col.width === 'number' ? col.width : 150
        leftOffset += width
      }
    }

    // Calculate right offsets for right-pinned columns (iterate in reverse)
    let rightOffset = 0
    for (let i = columnsWithId.length - 1; i >= 0; i--) {
      const col = columnsWithId[i]
      if (pinnedColumns.right.includes(col.key)) {
        const baseStyle = {
          position: 'sticky' as const,
          right: rightOffset,
          zIndex: 2,
        }
        headerStyles[col.key] = {
          ...baseStyle,
          zIndex: 3,
        }
        cellStyles[col.key] = {
          ...baseStyle,
          backgroundColor: 'var(--color-bg-container)',
        }
        const width = typeof col.width === 'number' ? col.width : 150
        rightOffset += width
      }
    }

    return { headerStyles, cellStyles }
  }, [columnsWithId, pinnedColumns])

  // Generate a stable key for the table based on visible column keys, pinned state, and header checkbox version
  // This forces a remount when column visibility/pinning changes or when header checkbox is clicked
  const tableKey = useMemo(() => {
    const visibleKeys = visibleColumns.map((col) => col.key).join(',')
    const pinnedKey = `L:${pinnedColumns.left.join('|')}R:${pinnedColumns.right.join('|')}`
    return `${visibleKeys}::${pinnedKey}::v${headerCheckboxVersion}`
  }, [visibleColumns, pinnedColumns, headerCheckboxVersion])

  // Render cell content
  const renderCellContent = useCallback(
    (column: ColumnDef<T> & { id: string }, item: T, index: number) => {
      if (column.render) {
        return column.render(
          column.dataIndex ? item[column.dataIndex] : undefined,
          item,
          index
        )
      }
      if (column.dataIndex) {
        return String(item[column.dataIndex] ?? '')
      }
      return null
    },
    []
  )

  // Compute selected records for bulk actions
  const selectedRecordsInfo = useMemo(() => {
    if (effectiveSelectedKeys === 'all') {
      return {
        count: sortedData.length,
        records: sortedData,
        keys: new Set(sortedData.map((item) => getRowKey(item))),
      }
    }
    const keysSet = effectiveSelectedKeys as Set<Key>
    const records = sortedData.filter((item) => keysSet.has(getRowKey(item)))
    return {
      count: keysSet.size,
      records,
      keys: keysSet,
    }
  }, [effectiveSelectedKeys, sortedData, getRowKey])

  // Clear selection
  const clearSelection = useCallback(() => {
    handleSelectionChange(new Set())
  }, [handleSelectionChange])

  // Handler for header checkbox click - updates selection AND forces table re-render
  const handleHeaderCheckboxClick = useCallback((shouldSelectAll: boolean) => {
    const visibleKeys = paginatedData.map((item) => getRowKey(item))

    if (shouldSelectAll) {
      // Add all visible keys to selection
      const currentSet = effectiveSelectedKeys === 'all'
        ? new Set(sortedData.map((item) => getRowKey(item)))
        : new Set(effectiveSelectedKeys as Set<Key>)
      visibleKeys.forEach((key) => currentSet.add(key))
      handleSelectionChange(currentSet)
    } else {
      // Remove all visible keys from selection
      const currentSet = effectiveSelectedKeys === 'all'
        ? new Set(sortedData.map((item) => getRowKey(item)))
        : new Set(effectiveSelectedKeys as Set<Key>)
      visibleKeys.forEach((key) => currentSet.delete(key))
      handleSelectionChange(currentSet)
    }

    // Increment version to force table re-render (React Aria Column caches its children)
    setHeaderCheckboxVersion((v) => v + 1)
  }, [paginatedData, sortedData, effectiveSelectedKeys, getRowKey, handleSelectionChange])

  // Context value for header checkbox
  const selectionContextValue = useMemo<SelectionContextValue>(() => ({
    visibleKeys: paginatedData.map((item) => getRowKey(item)),
    allKeys: sortedData.map((item) => getRowKey(item)),
    selectedKeys: effectiveSelectedKeys,
    onHeaderCheckboxClick: handleHeaderCheckboxClick,
  }), [paginatedData, sortedData, effectiveSelectedKeys, getRowKey, handleHeaderCheckboxClick])

  return (
    <SelectionContext.Provider value={selectionContextValue}>
    <div className={`data-table-container ${className ?? ''} ${loading ? 'data-table-loading' : ''}`}>
      <Table
        key={tableKey}
        aria-label="Data table"
        className="data-table"
        selectionMode={selectionMode === 'none' ? undefined : selectionMode}
        selectionBehavior={selectionMode !== 'none' ? 'toggle' : undefined}
        selectedKeys={effectiveSelectedKeys}
        onSelectionChange={handleSelectionChange}
        disabledKeys={disabledKeys}
        sortDescriptor={sortDescriptor}
        onSortChange={handleSortChange}
        onRowAction={hasClickHandler ? handleRowAction : undefined}
      >
        <TableHeader columns={columnsWithId} className="data-table-header">
          {(column) => (
            <Column
              key={column.key}
              isRowHeader={column.isRowHeader}
              allowsSorting={column.key !== '__selection__' && column.sortable}
              width={typeof column.width === 'number' ? column.width : undefined}
              className={`data-table-column ${column.key === '__selection__' ? 'data-table-column-checkbox' : ''} ${columnPinStyles.headerStyles[column.key] ? 'data-table-column-pinned' : ''}`}
              style={{
                ...(typeof column.width === 'string' ? { width: column.width } : {}),
                ...columnPinStyles.headerStyles[column.key],
              }}
              data-align={column.key === '__selection__' ? 'center' : column.align}
              data-pinned={pinnedColumns.left.includes(column.key) ? 'left' : pinnedColumns.right.includes(column.key) ? 'right' : undefined}
            >
              {({ allowsSorting, sortDirection }) => (
                column.key === '__selection__' ? (
                  <HeaderCheckboxCell />
                ) : (
                  <div className="data-table-column-content">
                    <span className="data-table-column-title">{column.title}</span>
                    <div className="data-table-column-icons">
                      {allowsSorting && <SortIcon direction={sortDirection} />}
                      <ColumnActionDropdown
                        columnKey={column.key}
                        columnIndex={columnsWithId.findIndex((c) => c.key === column.key)}
                        totalColumns={columnsWithId.length}
                        isPinnedLeft={pinnedColumns.left.includes(column.key)}
                        isPinnedRight={pinnedColumns.right.includes(column.key)}
                        hasFilters={Boolean(column.filters && column.filters.length > 0)}
                        filterOptions={column.filters}
                        activeFilters={activeFilters[column.key] ?? []}
                        onFilterChange={(values) => handleFilterChange(column.key, values)}
                        onMoveLeft={() => handleMoveColumnLeft(column.key)}
                        onMoveRight={() => handleMoveColumnRight(column.key)}
                        onMakeFirst={() => handleMakeColumnFirst(column.key)}
                        onMakeLast={() => handleMakeColumnLast(column.key)}
                        onHide={() => handleHideColumn(column.key)}
                        onPinLeft={() => handlePinColumnLeft(column.key)}
                        onPinRight={() => handlePinColumnRight(column.key)}
                        onUnpin={() => handleUnpinColumn(column.key)}
                      />
                    </div>
                  </div>
                )
              )}
            </Column>
          )}
        </TableHeader>

        <TableBody
          className="data-table-body"
          items={paginatedData}
          renderEmptyState={() => (
            <div className="data-table-empty">{emptyContent}</div>
          )}
        >
          {(item: T) => (
            <Row
              id={getRowKey(item)}
              columns={columnsWithId}
              className={getRowClassName(item, paginatedData.indexOf(item))}
              data-has-action={hasClickHandler || undefined}
              onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(item) : undefined}
            >
              {(column) => (
                <Cell
                  className={`data-table-cell ${column.key === '__selection__' ? 'data-table-cell-checkbox' : ''} ${column.ellipsis ? 'data-table-cell-ellipsis' : ''} ${columnPinStyles.cellStyles[column.key] ? 'data-table-cell-pinned' : ''}`}
                  style={columnPinStyles.cellStyles[column.key]}
                  data-align={column.key === '__selection__' ? 'center' : column.align}
                  data-pinned={pinnedColumns.left.includes(column.key) ? 'left' : pinnedColumns.right.includes(column.key) ? 'right' : undefined}
                >
                  {column.key === '__selection__' ? (
                    <TableCheckbox
                      slot="selection"
                      aria-label={`Select row`}
                    />
                  ) : (
                    renderCellContent(column, item, paginatedData.indexOf(item))
                  )}
                </Cell>
              )}
            </Row>
          )}
        </TableBody>
      </Table>

      {(pagination !== false || showColumnManager) && (
        <div className="data-table-footer">
          {pagination !== false && (
            <TablePagination
              current={currentPage}
              pageSize={pageSize}
              total={pagination?.total ?? sortedData.length}
              pageSizeOptions={pagination?.pageSizeOptions}
              showSizeChanger={pagination?.showSizeChanger}
              showTotal={pagination?.showTotal}
              onChange={handlePaginationChange}
            />
          )}
          {showColumnManager && (
            <ColumnManager
              columns={columnManagerItems}
              onChange={handleColumnManagerChange}
              onReorder={handleColumnReorder}
            />
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectionMode === 'multiple' && selectedRecordsInfo.count > 0 && bulkActions && bulkActions.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedRecordsInfo.count}
          selectedRecords={selectedRecordsInfo.records}
          selectedKeys={selectedRecordsInfo.keys}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />
      )}
    </div>
    </SelectionContext.Provider>
  )
}
// Column action dropdown component
interface ColumnActionDropdownProps {
  columnKey: string
  columnIndex: number
  totalColumns: number
  isPinnedLeft?: boolean
  isPinnedRight?: boolean
  hasFilters?: boolean
  filterOptions?: { text: string; value: unknown }[]
  activeFilters?: unknown[]
  onFilterChange?: (values: unknown[]) => void
  onMoveLeft?: () => void
  onMoveRight?: () => void
  onMakeFirst?: () => void
  onMakeLast?: () => void
  onHide?: () => void
  onPinLeft?: () => void
  onPinRight?: () => void
  onUnpin?: () => void
}

// Icons for column actions
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 3.5H14M4 7.5H12M6 11.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const MoveLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MoveRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 2V5L12 7V10H9V14L8 15L7 14V10H4V7L6 5V2H10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const UnpinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 2V5L12 7V10H9V14L8 15L7 14V10H4V7L6 5V2H10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 14L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const HideIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 8C2 8 4 4 8 4C12 4 14 8 14 8C14 8 12 12 8 12C4 12 2 8 2 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Sparkle/action icon for column dropdown trigger
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1V3M6 9V11M1 6H3M9 6H11M2.5 2.5L3.5 3.5M8.5 8.5L9.5 9.5M9.5 2.5L8.5 3.5M3.5 8.5L2.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

function ColumnActionDropdown({
  columnIndex,
  totalColumns,
  isPinnedLeft,
  isPinnedRight,
  hasFilters,
  filterOptions = [],
  activeFilters = [],
  onFilterChange,
  onMoveLeft,
  onMoveRight,
  onMakeFirst,
  onMakeLast,
  onHide,
  onPinLeft,
  onPinRight,
  onUnpin
}: ColumnActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showFilterSubmenu, setShowFilterSubmenu] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isFirstColumn = columnIndex === 0
  const isLastColumn = columnIndex === totalColumns - 1
  const isPinned = isPinnedLeft || isPinnedRight

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 205
      const viewportWidth = window.innerWidth
      // Get sidebar width (look for sidebar-container element or use default)
      const sidebar = document.querySelector('.sidebar-container')
      const sidebarWidth = sidebar ? sidebar.getBoundingClientRect().right : 164
      const minLeft = sidebarWidth + 8

      // Position dropdown below button, aligned to right edge
      let left = rect.right - dropdownWidth
      // Ensure it doesn't go under the sidebar
      if (left < minLeft) left = minLeft
      // Ensure it doesn't go off the right edge
      if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 8
      }
      setDropdownPosition({
        top: rect.bottom + 4,
        left,
      })
    }
  }, [isOpen])

  const handleAction = (action: string) => {
    switch (action) {
      case 'move-left':
        onMoveLeft?.()
        break
      case 'move-right':
        onMoveRight?.()
        break
      case 'make-first':
        onMakeFirst?.()
        break
      case 'make-last':
        onMakeLast?.()
        break
      case 'hide':
        onHide?.()
        break
      case 'pin-left':
        onPinLeft?.()
        break
      case 'pin-right':
        onPinRight?.()
        break
      case 'unpin':
        onUnpin?.()
        break
    }
    setIsOpen(false)
    setShowFilterSubmenu(false)
  }

  const handleFilterToggle = (value: unknown) => {
    if (!onFilterChange) return
    const newFilters = activeFilters.includes(value)
      ? activeFilters.filter((v) => v !== value)
      : [...activeFilters, value]
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    if (onFilterChange) {
      onFilterChange([])
    }
    setShowFilterSubmenu(false)
    setIsOpen(false)
  }

  return (
    <div
      className="data-table-column-action-wrapper"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        className={`data-table-column-action ${activeFilters.length > 0 ? 'has-active-filter' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsOpen(!isOpen)
          setShowFilterSubmenu(false)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Column actions"
        aria-expanded={isOpen}
      >
        <SparkleIcon />
      </button>

      {isOpen && (
        <>
          <div className="data-table-column-dropdown-backdrop" onClick={() => { setIsOpen(false); setShowFilterSubmenu(false); }} />
          <div
            className="data-table-column-dropdown"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              right: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {hasFilters && (
              <>
                <div className="data-table-column-dropdown-item-group">
                  <button
                    className="data-table-column-dropdown-item"
                    onClick={() => setShowFilterSubmenu(!showFilterSubmenu)}
                  >
                    <span className="data-table-column-dropdown-item-icon"><FilterIcon /></span>
                    <span className="data-table-column-dropdown-item-text">Filter</span>
                    {activeFilters.length > 0 && (
                      <span className="data-table-column-dropdown-item-badge">{activeFilters.length}</span>
                    )}
                    <span className="data-table-column-dropdown-item-arrow">›</span>
                  </button>
                  {showFilterSubmenu && (
                    <div className="data-table-column-dropdown-submenu">
                      {filterOptions.map((option) => (
                        <button
                          key={String(option.value)}
                          className={`data-table-column-dropdown-item ${activeFilters.includes(option.value) ? 'selected' : ''}`}
                          onClick={() => handleFilterToggle(option.value)}
                        >
                          <span className="data-table-column-dropdown-item-icon">
                            {activeFilters.includes(option.value) && <CheckIcon />}
                          </span>
                          <span className="data-table-column-dropdown-item-text">{option.text}</span>
                        </button>
                      ))}
                      {activeFilters.length > 0 && (
                        <>
                          <div className="data-table-column-dropdown-divider" />
                          <button className="data-table-column-dropdown-item" onClick={handleClearFilters}>
                            <span className="data-table-column-dropdown-item-icon" />
                            <span className="data-table-column-dropdown-item-text">Clear filters</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="data-table-column-dropdown-divider" />
              </>
            )}
            <button
              className="data-table-column-dropdown-item"
              onClick={() => handleAction('move-left')}
              disabled={isFirstColumn}
              style={{ opacity: isFirstColumn ? 0.4 : 1, cursor: isFirstColumn ? 'not-allowed' : 'pointer' }}
            >
              <span className="data-table-column-dropdown-item-icon"><MoveLeftIcon /></span>
              <span className="data-table-column-dropdown-item-text">Move left</span>
            </button>
            <button
              className="data-table-column-dropdown-item"
              onClick={() => handleAction('move-right')}
              disabled={isLastColumn}
              style={{ opacity: isLastColumn ? 0.4 : 1, cursor: isLastColumn ? 'not-allowed' : 'pointer' }}
            >
              <span className="data-table-column-dropdown-item-icon"><MoveRightIcon /></span>
              <span className="data-table-column-dropdown-item-text">Move right</span>
            </button>
            <button
              className="data-table-column-dropdown-item"
              onClick={() => handleAction('make-first')}
              disabled={isFirstColumn}
              style={{ opacity: isFirstColumn ? 0.4 : 1, cursor: isFirstColumn ? 'not-allowed' : 'pointer' }}
            >
              <span className="data-table-column-dropdown-item-icon"><MoveLeftIcon /></span>
              <span className="data-table-column-dropdown-item-text">Make 1st column</span>
            </button>
            <button
              className="data-table-column-dropdown-item"
              onClick={() => handleAction('make-last')}
              disabled={isLastColumn}
              style={{ opacity: isLastColumn ? 0.4 : 1, cursor: isLastColumn ? 'not-allowed' : 'pointer' }}
            >
              <span className="data-table-column-dropdown-item-icon"><MoveRightIcon /></span>
              <span className="data-table-column-dropdown-item-text">Make last column</span>
            </button>
            <div className="data-table-column-dropdown-divider" />
            {isPinned ? (
              <button className="data-table-column-dropdown-item" onClick={() => handleAction('unpin')}>
                <span className="data-table-column-dropdown-item-icon"><UnpinIcon /></span>
                <span className="data-table-column-dropdown-item-text">Unpin column</span>
              </button>
            ) : (
              <>
                <button
                  className="data-table-column-dropdown-item"
                  onClick={() => handleAction('pin-left')}
                >
                  <span className="data-table-column-dropdown-item-icon"><PinIcon /></span>
                  <span className="data-table-column-dropdown-item-text">Pin left</span>
                </button>
                <button
                  className="data-table-column-dropdown-item"
                  onClick={() => handleAction('pin-right')}
                >
                  <span className="data-table-column-dropdown-item-icon"><PinIcon /></span>
                  <span className="data-table-column-dropdown-item-text">Pin right</span>
                </button>
              </>
            )}
            <div className="data-table-column-dropdown-divider" />
            <button className="data-table-column-dropdown-item" onClick={() => handleAction('hide')}>
              <span className="data-table-column-dropdown-item-icon"><HideIcon /></span>
              <span className="data-table-column-dropdown-item-text">Hide column</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

