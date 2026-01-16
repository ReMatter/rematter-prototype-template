// Quote / Bid types

import type { QuoteStatus, WeightUnit, Currency, AuditFields } from './common';

export type QuoteType = 'purchase' | 'sales';

export interface QuoteLineItem {
  id: string;
  commodityId: string;
  commodityName?: string;  // Denormalized for display
  description?: string;
  quantity: number;
  unit: WeightUnit;
  pricePerUnit: number;
  totalPrice: number;
}

export interface Quote extends AuditFields {
  id: string;
  quoteNumber: string;
  type: QuoteType;
  status: QuoteStatus;
  partyId: string;        // Supplier (purchase) or Customer (sales)
  partyName?: string;     // Denormalized for display
  lineItems: QuoteLineItem[];
  subtotal: number;
  currency: Currency;
  validUntil: string;
  terms?: string;
  notes?: string;
  convertedToOrderId?: string;
}

// Helper to determine if quote is expired
export const isQuoteExpired = (quote: Quote): boolean => {
  return new Date(quote.validUntil) < new Date();
};

// Helper to determine if quote can be converted
export const canConvertQuote = (quote: Quote): boolean => {
  return quote.status === 'accepted' && !quote.convertedToOrderId;
};
