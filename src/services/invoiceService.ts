import type { Invoice, InvoiceStatus, InvoiceType, Payment, FinancialTransactionRecord, PaymentTransactionStatus } from '../types'
import { invoicesCollection } from '../storage'
import { generateId } from '../schema'

const getInvoicePrefix = (type: InvoiceType): string => {
  switch (type) {
    case 'sales': return 'INV'
    case 'purchase': return 'BILL'
    case 'freight': return 'FRT'
    default: return 'INV'
  }
}

const generateInvoiceNumber = async (type: InvoiceType): Promise<string> => {
  const invoices = await invoicesCollection.getAll()
  const prefix = getInvoicePrefix(type)
  const sameTypeInvoices = invoices.filter(i => i.invoiceNumber.startsWith(prefix))
  const maxNum = sameTypeInvoices.reduce((max, inv) => {
    const match = inv.invoiceNumber.match(new RegExp(`${prefix}-(\\d+)`))
    if (match) {
      const num = parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)
  return `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}`
}

export const invoiceService = {
  async getAll(): Promise<Invoice[]> {
    return invoicesCollection.getAll()
  },

  async getById(id: string): Promise<Invoice | undefined> {
    return invoicesCollection.getById(id)
  },

  async getByInvoiceNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const invoices = await invoicesCollection.query(i => i.invoiceNumber === invoiceNumber)
    return invoices[0]
  },

  async create(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Invoice> {
    const now = new Date().toISOString()
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId('inv'),
      invoiceNumber: await generateInvoiceNumber(invoiceData.type),
      payments: invoiceData.payments || [],
      createdBy: 'Current User',
      createdAt: now,
      updatedAt: now,
    }
    await invoicesCollection.create(newInvoice)
    return newInvoice
  },

  async update(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const existing = await invoicesCollection.getById(id)
    if (!existing) return undefined

    const updated: Invoice = {
      ...existing,
      ...updates,
      id,
      invoiceNumber: existing.invoiceNumber, // Prevent changing invoice number
      updatedAt: new Date().toISOString(),
    }
    return invoicesCollection.update(id, updated)
  },

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice | undefined> {
    return invoiceService.update(id, { status })
  },

  async markAsSent(id: string): Promise<Invoice | undefined> {
    return invoiceService.updateStatus(id, 'sent')
  },

  async cancelInvoice(id: string): Promise<Invoice | undefined> {
    return invoiceService.updateStatus(id, 'cancelled')
  },

  async addPayment(invoiceId: string, paymentData: Omit<Payment, 'id' | 'invoiceId' | 'createdAt'>): Promise<Invoice | undefined> {
    const invoice = await invoiceService.getById(invoiceId)
    if (!invoice) return undefined

    const newPayment: Payment = {
      ...paymentData,
      id: generateId('pay'),
      invoiceId,
      createdAt: new Date().toISOString(),
    }

    const payments = [...invoice.payments, newPayment]
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const balanceDue = invoice.total - paidAmount

    let status: InvoiceStatus = invoice.status
    if (balanceDue <= 0) {
      status = 'paid'
    } else if (paidAmount > 0) {
      status = 'partial'
    }

    return invoiceService.update(invoiceId, {
      payments,
      paidAmount,
      balanceDue,
      status,
      paidDate: status === 'paid' ? paymentData.paymentDate : undefined,
    })
  },

  // Add payments for multiple invoices at once (pays full balance for each)
  async addBatchPayment(invoiceIds: string[], paymentData: Omit<Payment, 'id' | 'invoiceId' | 'createdAt' | 'amount'>): Promise<Invoice[]> {
    const updatedInvoices: Invoice[] = []

    for (const invoiceId of invoiceIds) {
      const invoice = await invoiceService.getById(invoiceId)
      if (!invoice || invoice.balanceDue <= 0) continue

      // Pay the full balance due
      const result = await invoiceService.addPayment(invoiceId, {
        ...paymentData,
        amount: invoice.balanceDue,
      })

      if (result) {
        updatedInvoices.push(result)
      }
    }

    return updatedInvoices
  },

  async delete(id: string): Promise<boolean> {
    return invoicesCollection.delete(id)
  },

  async search(query: string): Promise<Invoice[]> {
    const lowerQuery = query.toLowerCase()
    return invoicesCollection.query(i =>
      i.invoiceNumber.toLowerCase().includes(lowerQuery) ||
      (i.partyName || '').toLowerCase().includes(lowerQuery) ||
      (i.relatedOrderNumber || '').toLowerCase().includes(lowerQuery) ||
      (i.relatedLoadNumber || '').toLowerCase().includes(lowerQuery)
    )
  },

  async getByType(type: InvoiceType): Promise<Invoice[]> {
    return invoicesCollection.query(i => i.type === type)
  },

  async getByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    return invoicesCollection.query(i => i.status === status)
  },

  async getByParty(partyId: string): Promise<Invoice[]> {
    return invoicesCollection.query(i => i.partyId === partyId)
  },

  async getAccountsReceivable(): Promise<Invoice[]> {
    return invoicesCollection.query(i => i.type === 'sales' && i.balanceDue > 0)
  },

  async getAccountsPayable(): Promise<Invoice[]> {
    return invoicesCollection.query(i => (i.type === 'purchase' || i.type === 'freight') && i.balanceDue > 0)
  },

  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date().toISOString().split('T')[0]
    return invoicesCollection.query(i =>
      i.status !== 'paid' &&
      i.status !== 'cancelled' &&
      i.dueDate < today
    )
  },

  async getStats(): Promise<{
    totalInvoices: number
    arTotal: number
    arOutstanding: number
    arOverdue: number
    arOverdueCount: number
    apTotal: number
    apOutstanding: number
    apOverdue: number
    apOverdueCount: number
    paidCount: number
    pendingCount: number
  }> {
    const invoices = await invoicesCollection.getAll()
    const ar = invoices.filter(i => i.type === 'sales')
    const ap = invoices.filter(i => i.type === 'purchase' || i.type === 'freight')

    const arOutstanding = ar.filter(i => i.balanceDue > 0)
    const apOutstanding = ap.filter(i => i.balanceDue > 0)

    const today = new Date().toISOString().split('T')[0]
    const arOverdue = ar.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.dueDate < today)
    const apOverdue = ap.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.dueDate < today)

    return {
      totalInvoices: invoices.length,
      arTotal: ar.reduce((sum, i) => sum + i.total, 0),
      arOutstanding: arOutstanding.reduce((sum, i) => sum + i.balanceDue, 0),
      arOverdue: arOverdue.reduce((sum, i) => sum + i.balanceDue, 0),
      arOverdueCount: arOverdue.length,
      apTotal: ap.reduce((sum, i) => sum + i.total, 0),
      apOutstanding: apOutstanding.reduce((sum, i) => sum + i.balanceDue, 0),
      apOverdue: apOverdue.reduce((sum, i) => sum + i.balanceDue, 0),
      apOverdueCount: apOverdue.length,
      paidCount: invoices.filter(i => i.status === 'paid').length,
      pendingCount: invoices.filter(i => i.status === 'sent' || i.status === 'partial').length,
    }
  },

  async getAgingReport(type: 'ar' | 'ap'): Promise<{
    current: number
    days1to30: number
    days31to60: number
    days61to90: number
    over90: number
  }> {
    const invoices = await invoicesCollection.getAll()
    const filtered = type === 'ar'
      ? invoices.filter(i => i.type === 'sales' && i.balanceDue > 0)
      : invoices.filter(i => (i.type === 'purchase' || i.type === 'freight') && i.balanceDue > 0)

    const today = new Date()
    const buckets = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      over90: 0,
    }

    filtered.forEach(invoice => {
      const dueDate = new Date(invoice.dueDate)
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysOverdue <= 0) {
        buckets.current += invoice.balanceDue
      } else if (daysOverdue <= 30) {
        buckets.days1to30 += invoice.balanceDue
      } else if (daysOverdue <= 60) {
        buckets.days31to60 += invoice.balanceDue
      } else if (daysOverdue <= 90) {
        buckets.days61to90 += invoice.balanceDue
      } else {
        buckets.over90 += invoice.balanceDue
      }
    })

    return buckets
  },

  // Get AR invoices grouped by customer
  async getARGroupedByCustomer(): Promise<Array<{
    accountId: string
    accountName: string
    invoices: Invoice[]
    invoiceCount: number
    balanceOwed: number
    earliestReceivableDate: string
  }>> {
    const invoices = await invoicesCollection.getAll()
    const salesInvoices = invoices.filter(i => i.type === 'sales')

    const grouped = new Map<string, {
      accountId: string
      accountName: string
      invoices: Invoice[]
      invoiceCount: number
      balanceOwed: number
      earliestReceivableDate: string
    }>()

    salesInvoices.forEach(invoice => {
      const existing = grouped.get(invoice.partyId)
      if (existing) {
        existing.invoices.push(invoice)
        existing.invoiceCount++
        existing.balanceOwed += invoice.balanceDue
        if (invoice.dueDate < existing.earliestReceivableDate) {
          existing.earliestReceivableDate = invoice.dueDate
        }
      } else {
        grouped.set(invoice.partyId, {
          accountId: invoice.partyId,
          accountName: invoice.partyName || 'Unknown',
          invoices: [invoice],
          invoiceCount: 1,
          balanceOwed: invoice.balanceDue,
          earliestReceivableDate: invoice.dueDate,
        })
      }
    })

    return Array.from(grouped.values())
  },

  // Get AP invoices grouped by vendor
  async getAPGroupedByVendor(): Promise<Array<{
    accountId: string
    accountName: string
    invoices: Invoice[]
    invoiceCount: number
    balanceOwed: number
    earliestPayableDate: string
  }>> {
    const invoices = await invoicesCollection.getAll()
    const apInvoices = invoices.filter(i => i.type === 'purchase' || i.type === 'freight')

    const grouped = new Map<string, {
      accountId: string
      accountName: string
      invoices: Invoice[]
      invoiceCount: number
      balanceOwed: number
      earliestPayableDate: string
    }>()

    apInvoices.forEach(invoice => {
      const existing = grouped.get(invoice.partyId)
      if (existing) {
        existing.invoices.push(invoice)
        existing.invoiceCount++
        existing.balanceOwed += invoice.balanceDue
        if (invoice.dueDate < existing.earliestPayableDate) {
          existing.earliestPayableDate = invoice.dueDate
        }
      } else {
        grouped.set(invoice.partyId, {
          accountId: invoice.partyId,
          accountName: invoice.partyName || 'Unknown',
          invoices: [invoice],
          invoiceCount: 1,
          balanceOwed: invoice.balanceDue,
          earliestPayableDate: invoice.dueDate,
        })
      }
    })

    return Array.from(grouped.values())
  },

  // Get sales invoices (AR)
  async getSalesInvoices(): Promise<Invoice[]> {
    return invoicesCollection.query(i => i.type === 'sales')
  },

  // Get AP invoices (purchase + freight)
  async getAPInvoices(): Promise<Invoice[]> {
    return invoicesCollection.query(i => i.type === 'purchase' || i.type === 'freight')
  },

  // Get net balances grouped by counterparty (for netting AR vs AP)
  async getBalancesByCounterparty(): Promise<Array<{
    accountId: string
    accountName: string
    arInvoices: Invoice[]
    apInvoices: Invoice[]
    arBalance: number
    apBalance: number
    netBalance: number
    transactionCount: number
    earliestDueDate: string
  }>> {
    const invoices = await invoicesCollection.getAll()

    const grouped = new Map<string, {
      accountId: string
      accountName: string
      arInvoices: Invoice[]
      apInvoices: Invoice[]
      arBalance: number
      apBalance: number
      netBalance: number
      transactionCount: number
      earliestDueDate: string
    }>()

    invoices.forEach(invoice => {
      const existing = grouped.get(invoice.partyId)
      const isAR = invoice.type === 'sales'

      if (existing) {
        if (isAR) {
          existing.arInvoices.push(invoice)
          existing.arBalance += invoice.balanceDue
        } else {
          existing.apInvoices.push(invoice)
          existing.apBalance += invoice.balanceDue
        }
        existing.transactionCount++
        existing.netBalance = existing.arBalance - existing.apBalance
        if (invoice.dueDate < existing.earliestDueDate) {
          existing.earliestDueDate = invoice.dueDate
        }
      } else {
        grouped.set(invoice.partyId, {
          accountId: invoice.partyId,
          accountName: invoice.partyName || 'Unknown',
          arInvoices: isAR ? [invoice] : [],
          apInvoices: isAR ? [] : [invoice],
          arBalance: isAR ? invoice.balanceDue : 0,
          apBalance: isAR ? 0 : invoice.balanceDue,
          netBalance: isAR ? invoice.balanceDue : -invoice.balanceDue,
          transactionCount: 1,
          earliestDueDate: invoice.dueDate,
        })
      }
    })

    return Array.from(grouped.values())
  },

  // Get all payments as flattened transaction records
  async getAllPayments(): Promise<FinancialTransactionRecord[]> {
    const invoices = await invoicesCollection.getAll()
    const transactions: FinancialTransactionRecord[] = []

    invoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        transactions.push({
          id: payment.id,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          notes: payment.notes,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.type,
          type: invoice.type === 'sales' ? 'payment_received' : 'payment_made',
          accountId: invoice.partyId,
          accountName: invoice.partyName || '',
          relatedOrderNumber: invoice.relatedOrderNumber,
          relatedLoadNumber: invoice.relatedLoadNumber,
          status: 'completed' as PaymentTransactionStatus,
          createdBy: invoice.createdBy,
          createdAt: payment.createdAt,
        })
      })
    })

    // Sort by payment date descending (most recent first)
    return transactions.sort((a, b) =>
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    )
  },

  // Get payment by ID
  async getPaymentById(paymentId: string): Promise<FinancialTransactionRecord | undefined> {
    const transactions = await invoiceService.getAllPayments()
    return transactions.find(t => t.id === paymentId)
  },

  // Void/reverse a payment (removes from invoice, recalculates balances)
  async voidPayment(paymentId: string, _reason?: string): Promise<Invoice | undefined> {
    const invoices = await invoicesCollection.getAll()

    for (const invoice of invoices) {
      const paymentIndex = invoice.payments.findIndex(p => p.id === paymentId)
      if (paymentIndex !== -1) {
        // Remove payment
        const updatedPayments = [...invoice.payments]
        updatedPayments.splice(paymentIndex, 1)

        // Recalculate invoice totals
        const paidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
        const balanceDue = invoice.total - paidAmount

        // Update status
        let status: InvoiceStatus = invoice.status
        if (balanceDue === invoice.total) {
          status = invoice.status === 'paid' || invoice.status === 'partial' ? 'sent' : invoice.status
        } else if (balanceDue > 0 && paidAmount > 0) {
          status = 'partial'
        } else if (balanceDue <= 0) {
          status = 'paid'
        }

        return invoiceService.update(invoice.id, {
          payments: updatedPayments,
          paidAmount,
          balanceDue,
          status,
          paidDate: status === 'paid' ? invoice.paidDate : undefined,
        })
      }
    }
    return undefined
  },

  // Get payment statistics
  async getPaymentStats(): Promise<{
    totalTransactions: number
    totalReceived: number
    totalPaid: number
    recentCount: number
  }> {
    const transactions = await invoiceService.getAllPayments()
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentTransactions = transactions.filter(
      t => new Date(t.paymentDate) >= thirtyDaysAgo
    )

    return {
      totalTransactions: transactions.length,
      totalReceived: transactions
        .filter(t => t.type === 'payment_received')
        .reduce((sum, t) => sum + t.amount, 0),
      totalPaid: transactions
        .filter(t => t.type === 'payment_made')
        .reduce((sum, t) => sum + t.amount, 0),
      recentCount: recentTransactions.length,
    }
  },

  async reset(): Promise<void> {
    await invoicesCollection.clear()
    // Data will be re-seeded on next storage initialization
  },
}
