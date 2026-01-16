// Sales Order types

import type { OrderStatus, Unit, Currency, AuditFields, FileAttachment } from './common';

export type SalesOrderType = 'brokered' | 'physical_sale';

export interface OrderLineItem {
  id: string;
  commodityId: string;
  commodityName?: string;  // Denormalized for display
  description?: string;
  quantity: number;
  unit: Unit;  // Weight or quantity unit
  pricePerUnit: number;
  totalPrice: number;
  shippedQuantity?: number;
  receivedQuantity?: number;
}

export interface SalesOrder extends AuditFields {
  id: string;
  orderNumber: string;
  type: SalesOrderType;
  status: OrderStatus;
  customerId: string;
  customerName?: string;     // Denormalized for display
  counterpartyId?: string;   // For brokered: the supplier
  counterpartyName?: string; // Denormalized for display
  facilityId?: string;
  lineItems: OrderLineItem[];
  subtotal: number;
  currency: Currency;
  startDate: string;
  endDate?: string;
  shippedWeight?: number;
  fulfilledPercent: number;
  terms?: string;
  notes?: string;
  quoteId?: string;          // If created from quote
  attachments?: FileAttachment[];
  counterpartyPurchaseOrderNumber?: string;
  accountRepresentativeId?: string;
  customerLocationId?: string;
  customerContactId?: string;
  freightTerms?: string;
  brokeredOrderId?: string;  // ID of the brokered order this SO is linked to
}

// Calculate fulfillment percentage
export const calculateFulfillment = (order: SalesOrder): number => {
  const totalQty = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const shippedQty = order.lineItems.reduce((sum, item) => sum + (item.shippedQuantity || 0), 0);
  return totalQty > 0 ? Math.round((shippedQty / totalQty) * 100) : 0;
};
