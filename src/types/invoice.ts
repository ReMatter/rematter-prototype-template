// Invoice types (AR & AP)

import type { InvoiceStatus, Currency, AuditFields } from './common';

export type InvoiceType = 'sales' | 'purchase' | 'freight';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  commodityId?: string;
  commodityName?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice extends AuditFields {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  partyId: string;
  partyName?: string;           // Denormalized
  relatedOrderId?: string;      // Sales or Purchase Order
  relatedOrderNumber?: string;  // Denormalized
  relatedLoadId?: string;       // For freight invoices
  relatedLoadNumber?: string;   // Denormalized
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paidAmount: number;
  balanceDue: number;
  payments: Payment[];
  notes?: string;
}

// Check if invoice is overdue
export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === 'paid') return false;
  return new Date(invoice.dueDate) < new Date();
};

// Calculate days overdue
export const daysOverdue = (invoice: Invoice): number => {
  if (!isInvoiceOverdue(invoice)) return 0;
  const due = new Date(invoice.dueDate);
  const now = new Date();
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
};

// Determine invoice age bucket for aging report
export const getAgingBucket = (invoice: Invoice): string => {
  const days = daysOverdue(invoice);
  if (days <= 0) return 'Current';
  if (days <= 30) return '1-30 Days';
  if (days <= 60) return '31-60 Days';
  if (days <= 90) return '61-90 Days';
  return '90+ Days';
};
