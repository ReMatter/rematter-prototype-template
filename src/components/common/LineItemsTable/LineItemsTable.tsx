import { Select, NumberInput } from '../Form'
import { TrashIcon, PlusCircleIcon } from '../Icons'
import { getWeighingUnit } from './unitConversion'
import type { LineItemsTableProps, BaseLineItem, LineItemColumn } from './types'
import './styles.css'

export function LineItemsTable<T extends BaseLineItem = BaseLineItem>({
  items,
  columns,
  selectOptions = {},
  unitOptions,
  onAdd,
  onChange,
  onRemove,
  readOnly = false,
  showWeighingToggle = false,
  usePricingUnitForWeighing = false,
  onToggleWeighingUnit,
  title,
  itemLabel = 'Item',
  addButtonLabel,
  emptyMessage,
  showFooterTotals = true,
  totalWeight = 0,
  totalQuantity = 0,
  subtotal = 0,
  weightItemCount = 0,
  quantityItemCount = 0,
}: LineItemsTableProps<T>) {
  // Generate grid template from column widths
  // In readOnly mode, don't include the action column
  const gridTemplate = readOnly
    ? columns.map((col) => col.width || '1fr').join(' ')
    : columns.map((col) => col.width || '1fr').concat(['40px']).join(' ')

  const renderCell = (column: LineItemColumn<T>, item: T, index: number) => {
    const { type, field, options, placeholder, unitField } = column

    switch (type) {
      case 'select': {
        const columnOptions = selectOptions[column.key] || options || []
        const value = field ? (item[field] as string) : ''
        // In readOnly mode, show the label instead of a select
        if (readOnly) {
          const selectedOption = columnOptions.find(opt => opt.value === value)
          return (
            <div className="line-items-readonly-value">{selectedOption?.label || value || '-'}</div>
          )
        }
        return (
          <Select
            value={value}
            onChange={(val) => field && onChange?.(index, field, val)}
            placeholder={placeholder || 'Select...'}
            options={columnOptions}
          />
        )
      }

      case 'unit': {
        const value = field ? (item[field] as string) : item.unit
        const unitOpts = unitOptions || [
          { value: 'LB', label: 'lb' },
          { value: 'EA', label: 'ea' },
          { value: 'KG', label: 'kg' },
          { value: 'TON', label: 'ton' },
        ]
        if (readOnly) {
          const selectedOption = unitOpts.find(opt => opt.value === value)
          return (
            <div className="line-items-readonly-value">{selectedOption?.label || value}</div>
          )
        }
        return (
          <Select
            value={value}
            onChange={(val) => onChange?.(index, field || 'unit', val)}
            options={unitOpts}
          />
        )
      }

      case 'price': {
        const value = field ? (item[field] as number) : item.pricePerUnit
        if (readOnly) {
          return (
            <div className="line-items-readonly-value">
              ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )
        }
        return (
          <NumberInput
            value={value}
            onChange={(val) => onChange?.(index, field || 'pricePerUnit', val)}
            min={0}
            step={0.01}
            prefix="$"
          />
        )
      }

      case 'quantity': {
        const value = field ? (item[field] as number) : item.quantity
        const unitValue = unitField ? (item[unitField] as string) : item.unit
        const displayUnit = getWeighingUnit(unitValue, usePricingUnitForWeighing)
        if (readOnly) {
          return (
            <div className="line-items-readonly-value">
              {value.toLocaleString()} {displayUnit.toLowerCase()}
            </div>
          )
        }
        return (
          <NumberInput
            value={value}
            onChange={(val) => onChange?.(index, field || 'quantity', val)}
            min={0}
            suffix={displayUnit.toLowerCase()}
          />
        )
      }

      case 'total': {
        const value = field ? (item[field] as number) : item.totalPrice
        return (
          <div className="line-items-total-display">
            ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        )
      }

      case 'custom': {
        return column.render?.(item, index) ?? null
      }

      default:
        return null
    }
  }

  return (
    <div className="line-items-section">
      {/* Header with title and optional toggle */}
      <div className="line-items-header">
        <h3 className="line-items-title">{title}</h3>
        {showWeighingToggle && onToggleWeighingUnit && (
          <button
            type="button"
            className="line-items-toggle"
            onClick={onToggleWeighingUnit}
          >
            <div className={`line-items-toggle-switch${usePricingUnitForWeighing ? ' active' : ''}`} />
            <span className="line-items-toggle-label">
              Use <strong>pricing unit</strong> for weighing
            </span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="line-items-table">
        {/* Header row */}
        <div className="line-items-table-header" style={{ gridTemplateColumns: gridTemplate }}>
          {columns.map((col) => (
            <div key={col.key} className="line-items-table-cell">
              {col.header}
            </div>
          ))}
          {!readOnly && <div className="line-items-table-cell" />} {/* Action column header */}
        </div>

        {/* Body rows */}
        <div className="line-items-table-body">
          {items.length === 0 ? (
            <div className="line-items-table-empty">
              {emptyMessage || (readOnly
                ? `No ${itemLabel.toLowerCase()}s.`
                : `No ${itemLabel.toLowerCase()}s added yet. Click "${addButtonLabel || `Add ${itemLabel}`}" to get started.`)}
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className="line-items-table-row"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {columns.map((col) => (
                  <div key={col.key} className="line-items-table-cell">
                    {renderCell(col, item, index)}
                  </div>
                ))}
                {!readOnly && (
                  <div className="line-items-table-cell line-items-table-cell--actions">
                    <button
                      type="button"
                      className="line-items-delete-btn"
                      onClick={() => onRemove?.(index)}
                      aria-label={`Remove ${itemLabel.toLowerCase()}`}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer with totals */}
        {showFooterTotals && items.length > 0 && (
          <div className="line-items-table-footer" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="line-items-table-cell">
              <span className="line-items-count">
                {items.length} {itemLabel}{items.length !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Empty cells to align with columns - skip first, fill middle */}
            {columns.slice(1, -2).map((col) => (
              <div key={`footer-${col.key}`} className="line-items-table-cell" />
            ))}
            {/* Weight/Quantity totals */}
            <div className="line-items-table-cell">
              <div className="line-items-totals-stack">
                {weightItemCount > 0 && (
                  <span className="line-items-weight-total">
                    <strong>{Math.round(totalWeight).toLocaleString()}</strong> lb
                  </span>
                )}
                {quantityItemCount > 0 && (
                  <span className="line-items-quantity-total">
                    <strong>{totalQuantity.toLocaleString()}</strong> ea
                  </span>
                )}
              </div>
            </div>
            {/* Subtotal */}
            <div className="line-items-table-cell">
              <span className="line-items-price-total">
                ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {!readOnly && <div className="line-items-table-cell" />} {/* Action column */}
          </div>
        )}
      </div>

      {/* Add button - only show in edit mode */}
      {!readOnly && onAdd && (
        <button type="button" className="line-items-add-btn" onClick={onAdd}>
          <PlusCircleIcon size={18} />
          {addButtonLabel || `Add ${itemLabel}`}
        </button>
      )}
    </div>
  )
}
