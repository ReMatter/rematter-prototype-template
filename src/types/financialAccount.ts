// Financial Account types

import type { AuditFields } from './common';

export type FinancialAccountType = 'checking' | 'savings' | 'cash' | 'credit' | 'investment';

export interface FinancialAccount extends AuditFields {
  id: string;
  name: string;
  type: FinancialAccountType;
  balance: number;
  isLinked: boolean;              // Plaid-linked
  lastSyncedAt?: string;          // Last Plaid sync timestamp
  isActive: boolean;
  hiddenForPurchases?: boolean;   // Visibility setting
  hiddenForSales?: boolean;
  accountNumber?: string;         // Last 4 digits for display
  institution?: string;           // Bank name
  notes?: string;
}

export type TransactionType = 'credit' | 'debit';

export interface FinancialTransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  category?: string;
  referenceNumber?: string;
  createdAt: string;
}

// Helper to get account type label
export const getAccountTypeLabel = (type: FinancialAccountType): string => {
  const labels: Record<FinancialAccountType, string> = {
    checking: 'Checking',
    savings: 'Savings',
    cash: 'Cash',
    credit: 'Credit',
    investment: 'Investment',
  };
  return labels[type];
};
