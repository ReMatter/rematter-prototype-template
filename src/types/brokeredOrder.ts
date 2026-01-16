// Brokered Order types

import type { OrderStatus, WeightUnit, Currency, AuditFields } from './common';

// Brokered orders use the same status as regular orders
export type BrokeredOrderStatus = OrderStatus;

export interface BrokeredOrder extends AuditFields {
  id: string;
  orderNumber: string;
  status: OrderStatus;

  // Location and responsible party
  locationId?: string;
  locationName?: string;           // Denormalized
  responsibleContactId?: string;
  responsibleContactName?: string; // Denormalized

  // Linked orders (can have multiple)
  purchaseOrderIds: string[];
  salesOrderIds: string[];

  // Legacy single order links (deprecated, kept for backward compatibility)
  purchaseOrderId: string;
  purchaseOrderNumber?: string;  // Denormalized
  salesOrderId: string;
  salesOrderNumber?: string;     // Denormalized

  // Parties
  supplierId: string;
  supplierName?: string;         // Denormalized
  customerId: string;
  customerName?: string;         // Denormalized

  // Commodity (for single-commodity orders)
  commodityId: string;
  commodityName?: string;         // Denormalized
  quantity: number;
  unit: WeightUnit;

  // Pricing
  purchasePricePerUnit: number;
  salesPricePerUnit: number;
  purchaseTotal: number;
  salesTotal: number;
  margin: number;                // salesTotal - purchaseTotal
  marginPercent: number;         // (margin / salesTotal) * 100
  currency: Currency;

  // Related entities
  loadIds: string[];
  notes?: string;
}

// Calculate margin from purchase and sales totals
export const calculateMargin = (purchaseTotal: number, salesTotal: number): number => {
  return salesTotal - purchaseTotal;
};

// Calculate margin percentage
export const calculateMarginPercent = (purchaseTotal: number, salesTotal: number): number => {
  if (salesTotal === 0) return 0;
  return Math.round(((salesTotal - purchaseTotal) / salesTotal) * 10000) / 100;
};
