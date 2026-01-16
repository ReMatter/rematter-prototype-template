// Common types used across the application

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface DateRange {
  start: string;
  end?: string;
}

export interface AuditFields {
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type WeightUnit = 'LB' | 'MT' | 'GT' | 'NT' | 'KG' | 'TON';
export type QuantityUnit = 'EA';
export type Unit = WeightUnit | QuantityUnit;

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';

export interface SelectOption {
  label: string;
  value: string;
}

// Status types for different entities
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
export type OrderStatus = 'open' | 'in_progress' | 'fulfilled' | 'closed' | 'voided';
export type LoadStatus = 'scheduled' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type AccountType = 'customer' | 'supplier' | 'carrier';

// File attachment for documents
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  sizeFormatted: string;
  dateAdded: string;
}
