// Transaction types for Financial Transactions page

export type PaymentTransactionType = 'payment_made' | 'payment_received'
export type PaymentTransactionStatus = 'completed' | 'voided'

// Flattened transaction record for display (derived from Payment + Invoice context)
export interface FinancialTransactionRecord {
  // From Payment
  id: string
  amount: number
  paymentDate: string
  paymentMethod?: string
  referenceNumber?: string
  notes?: string

  // From Invoice context
  invoiceId: string
  invoiceNumber: string
  invoiceType: 'sales' | 'purchase' | 'freight'
  type: PaymentTransactionType  // Derived: sales -> received, purchase/freight -> made
  accountId: string
  accountName: string
  relatedOrderNumber?: string
  relatedLoadNumber?: string

  // Status & audit
  status: PaymentTransactionStatus
  createdBy: string
  createdAt: string
  voidedAt?: string
  voidedBy?: string
  voidReason?: string
}

// Filter options for the Transactions page
export interface TransactionFilters {
  searchQuery?: string
  type?: PaymentTransactionType | 'all'
  dateStart?: string | null
  dateEnd?: string | null
  paymentMethod?: string
  amountMin?: number | null
  amountMax?: number | null
  status?: PaymentTransactionStatus | 'all'
  accountId?: string
}
