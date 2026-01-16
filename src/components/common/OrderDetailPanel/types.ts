import type { PurchaseOrder, SalesOrder } from '../../../types'

export type OrderType = 'purchase' | 'sales'

export type OrderDetailTab = 'info' | 'commodities' | 'party' | 'scaleTickets' | 'documents' | 'notes'

export interface OrderDetailPanelProps {
  /** The type of order being displayed */
  type: OrderType
  /** The order to display - either PurchaseOrder or SalesOrder */
  order: PurchaseOrder | SalesOrder
  /** Currently active tab */
  activeTab?: OrderDetailTab
  /** Callback when tab changes */
  onTabChange?: (tab: OrderDetailTab) => void
  /** Callback when finish button is clicked */
  onFinish?: () => void
  /** Callback when more options is clicked */
  onMoreOptions?: () => void
  /** Whether the panel is in read-only mode */
  readOnly?: boolean
  /** Whether to show the header */
  showHeader?: boolean
  /** Whether to show the action buttons in header */
  showActions?: boolean
}
