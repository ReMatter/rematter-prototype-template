// Purchase Order types

import type { OrderStatus, Currency, AuditFields, FileAttachment } from './common';
import type { OrderLineItem } from './salesOrder';

export interface PurchaseOrder extends AuditFields {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  supplierId: string;
  supplierName?: string;  // Denormalized for display
  facilityId?: string;
  lineItems: OrderLineItem[];
  subtotal: number;
  currency: Currency;
  startDate: string;
  endDate?: string;
  receivedWeight?: number;
  fulfilledPercent: number;
  terms?: string;
  notes?: string;
  quoteId?: string;       // If created from quote
  attachments?: FileAttachment[];
  counterpartySalesOrderNumber?: string;
  accountRepresentativeId?: string;
  supplierLocationId?: string;
  supplierContactId?: string;
  freightTerms?: string;
  brokeredOrderId?: string;  // ID of the brokered order this PO is linked to
}

// Calculate fulfillment percentage
export const calculatePOFulfillment = (order: PurchaseOrder): number => {
  const totalQty = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQty = order.lineItems.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  return totalQty > 0 ? Math.round((receivedQty / totalQty) * 100) : 0;
};
