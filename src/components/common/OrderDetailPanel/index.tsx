import { useState } from 'react'
import { Tag } from '../Tag'
import type { TagColor } from '../Tag'
import { DataTable } from '../Table'
import type { ColumnDef } from '../Table/types'
import type { PurchaseOrder, SalesOrder, OrderLineItem } from '../../../types'
import type { OrderDetailPanelProps, OrderDetailTab } from './types'
import { formatCurrency, formatNumber } from '../../../utils/formatters'
import './styles.css'

const statusColorMap: Record<string, TagColor> = {
  open: 'blue',
  in_progress: 'orange',
  fulfilled: 'cyan',
  closed: 'green',
  voided: 'red',
}

export function OrderDetailPanel({
  type,
  order,
  activeTab: controlledActiveTab,
  onTabChange,
  onFinish,
  onMoreOptions,
  readOnly = false,
  showHeader = true,
  showActions = true,
}: OrderDetailPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<OrderDetailTab>('commodities')

  // Use controlled or uncontrolled tab state
  const activeTab = controlledActiveTab ?? internalActiveTab
  const setActiveTab = (tab: OrderDetailTab) => {
    setInternalActiveTab(tab)
    onTabChange?.(tab)
  }

  const isPurchase = type === 'purchase'
  const statusColor = statusColorMap[order.status] || 'blue'
  const partyName = isPurchase
    ? (order as PurchaseOrder).supplierName
    : (order as SalesOrder).customerName
  const partyLabel = isPurchase ? 'Supplier' : 'Customer'
  const orderLabel = isPurchase ? 'Purchase Order' : 'Sales Order'

  // Line items columns for commodities tab
  const lineItemColumns: ColumnDef<OrderLineItem>[] = [
    {
      key: 'commodityName',
      title: 'Contract Commodities',
      dataIndex: 'commodityName',
      width: 200,
      isRowHeader: true,
    },
    {
      key: 'unit',
      title: 'Pricing Unit',
      dataIndex: 'unit',
      width: 100,
      render: (_v: unknown, r: OrderLineItem) => r.unit.toLowerCase(),
    },
    {
      key: 'pricePerUnit',
      title: 'Unit Price',
      dataIndex: 'pricePerUnit',
      align: 'right',
      width: 120,
      render: (_v: unknown, r: OrderLineItem) => formatCurrency(r.pricePerUnit),
    },
    {
      key: 'quantity',
      title: isPurchase ? 'Net Weight' : 'Quantity',
      dataIndex: 'quantity',
      align: 'right',
      width: 120,
      render: (_v: unknown, r: OrderLineItem) =>
        `${formatNumber(r.quantity)} ${r.unit.toLowerCase()}`,
    },
    {
      key: 'totalPrice',
      title: 'Estimated Total Price',
      dataIndex: 'totalPrice',
      align: 'right',
      width: 150,
      render: (_v: unknown, r: OrderLineItem) => formatCurrency(r.totalPrice),
    },
  ]

  const tabs: { key: OrderDetailTab; label: string; badge?: number }[] = [
    { key: 'info', label: 'Contract Info' },
    { key: 'commodities', label: 'Commodities', badge: order.lineItems?.length || 0 },
    { key: 'party', label: partyLabel },
    { key: 'scaleTickets', label: 'Scale Tickets', badge: 0 },
    { key: 'documents', label: 'Documents' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div className="order-detail-panel">
      {/* Header */}
      {showHeader && (
        <div className="order-detail-header">
          <div className="order-detail-header-left">
            <h2 className="order-detail-title">
              {orderLabel} #{order.orderNumber.replace(/^(PO-|SO-)/, '')}
            </h2>
            <Tag color={statusColor}>{order.status.replace('_', ' ')}</Tag>
            {(order.fulfilledPercent || 0) > 0 && (
              <div className="order-detail-progress">
                <div className="order-detail-progress-bar">
                  <div
                    className="order-detail-progress-fill"
                    style={{ width: `${order.fulfilledPercent}%` }}
                  />
                </div>
                <span className="order-detail-progress-label">
                  {order.fulfilledPercent}% fulfilled
                </span>
              </div>
            )}
          </div>
          {showActions && (
            <div className="order-detail-header-right">
              {onMoreOptions && (
                <button
                  className="order-detail-icon-btn"
                  title="More options"
                  onClick={onMoreOptions}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 8.667a.667.667 0 1 0 0-1.334.667.667 0 0 0 0 1.334ZM8 4a.667.667 0 1 0 0-1.333A.667.667 0 0 0 8 4ZM8 13.333A.667.667 0 1 0 8 12a.667.667 0 0 0 0 1.333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              {onFinish && (
                <button className="btn btn-primary" onClick={onFinish}>
                  Finish {orderLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="order-detail-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`order-detail-tab${activeTab === tab.key ? ' order-detail-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="order-detail-tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="order-detail-content">
        {/* Commodities Tab */}
        {activeTab === 'commodities' && (
          <div>
            <h3 className="order-detail-section-title">{orderLabel} Commodities</h3>
            <DataTable<OrderLineItem>
              data={order.lineItems || []}
              columns={lineItemColumns}
              rowKey="id"
              pagination={false}
              emptyContent="No commodities added"
            />
            <div className="order-detail-commodities-footer">
              <span className="order-detail-commodities-count">
                {order.lineItems?.length || 0} Commodities
              </span>
              <span className="order-detail-commodities-total">
                {formatCurrency(order.subtotal || 0)}
              </span>
            </div>
            {!readOnly && (
              <button className="btn btn-secondary order-detail-add-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3.333v9.334M3.333 8h9.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add Commodity
              </button>
            )}
          </div>
        )}

        {/* Contract Info Tab */}
        {activeTab === 'info' && (
          <div>
            <h3 className="order-detail-section-title">Contract Information</h3>
            <div className="order-detail-info-grid">
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Order Number</span>
                <span className="order-detail-info-value">{order.orderNumber}</span>
              </div>
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Status</span>
                <span className="order-detail-info-value">
                  <Tag color={statusColor}>{order.status.replace('_', ' ')}</Tag>
                </span>
              </div>
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Start Date</span>
                <span className="order-detail-info-value">
                  {order.startDate ? new Date(order.startDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">End Date</span>
                <span className="order-detail-info-value">
                  {order.endDate ? new Date(order.endDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Terms</span>
                <span className="order-detail-info-value">{order.terms || '-'}</span>
              </div>
              <div className="order-detail-info-item">
                <span className="order-detail-info-label">Currency</span>
                <span className="order-detail-info-value">{order.currency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Supplier/Customer Tab */}
        {activeTab === 'party' && (
          <div>
            <h3 className="order-detail-section-title">{partyLabel} Information</h3>
            <div className="order-detail-party-card">
              <div className="order-detail-party-name">{partyName || '-'}</div>
              <div className="order-detail-party-id">
                ID: {isPurchase ? (order as PurchaseOrder).supplierId : (order as SalesOrder).customerId}
              </div>
            </div>
          </div>
        )}

        {/* Scale Tickets Tab */}
        {activeTab === 'scaleTickets' && (
          <div>
            <h3 className="order-detail-section-title">Scale Tickets</h3>
            <div className="order-detail-empty-state">
              <p>No scale tickets linked to this order yet.</p>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div>
            <h3 className="order-detail-section-title">Documents</h3>
            <div className="order-detail-empty-state">
              <p>No documents attached yet.</p>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <h3 className="order-detail-section-title">Notes</h3>
            {order.notes ? (
              <p className="order-detail-notes">{order.notes}</p>
            ) : (
              <div className="order-detail-empty-state">
                <p>No notes for this order.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Re-export types
export type { OrderDetailPanelProps, OrderDetailTab, OrderType } from './types'
