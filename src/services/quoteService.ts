import type { Quote, QuoteStatus, QuoteType } from '../types'
import { quotesCollection } from '../storage'
import { generateId } from '../schema'

const getQuotePrefix = (type: QuoteType): string => {
  return type === 'sales' ? 'SQ' : 'PQ'
}

const generateQuoteNumber = async (type: QuoteType): Promise<string> => {
  const quotes = await quotesCollection.getAll()
  const prefix = getQuotePrefix(type)
  const sameTypeQuotes = quotes.filter(q => q.quoteNumber.startsWith(prefix))
  const maxNum = sameTypeQuotes.reduce((max, quote) => {
    const match = quote.quoteNumber.match(new RegExp(`${prefix}-(\\d+)`))
    if (match) {
      const num = parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)
  return `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}`
}

export const quoteService = {
  async getAll(): Promise<Quote[]> {
    return quotesCollection.getAll()
  },

  async getById(id: string): Promise<Quote | undefined> {
    return quotesCollection.getById(id)
  },

  async getByQuoteNumber(quoteNumber: string): Promise<Quote | undefined> {
    const quotes = await quotesCollection.query(q => q.quoteNumber === quoteNumber)
    return quotes[0]
  },

  async create(quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Quote> {
    const now = new Date().toISOString()
    const newQuote: Quote = {
      ...quoteData,
      id: generateId('quote'),
      quoteNumber: await generateQuoteNumber(quoteData.type),
      createdBy: 'Current User',
      createdAt: now,
      updatedAt: now,
    }
    await quotesCollection.create(newQuote)
    return newQuote
  },

  async update(id: string, updates: Partial<Quote>): Promise<Quote | undefined> {
    const existing = await quotesCollection.getById(id)
    if (!existing) return undefined

    const updated: Quote = {
      ...existing,
      ...updates,
      id,
      quoteNumber: existing.quoteNumber, // Prevent changing quote number
      updatedAt: new Date().toISOString(),
    }
    return quotesCollection.update(id, updated)
  },

  async updateStatus(id: string, status: QuoteStatus): Promise<Quote | undefined> {
    return quoteService.update(id, { status })
  },

  async markAsSent(id: string): Promise<Quote | undefined> {
    return quoteService.updateStatus(id, 'sent')
  },

  async accept(id: string): Promise<Quote | undefined> {
    return quoteService.updateStatus(id, 'accepted')
  },

  async reject(id: string): Promise<Quote | undefined> {
    return quoteService.updateStatus(id, 'rejected')
  },

  async markAsExpired(id: string): Promise<Quote | undefined> {
    return quoteService.updateStatus(id, 'expired')
  },

  async convertToOrder(id: string, orderId: string): Promise<Quote | undefined> {
    return quoteService.update(id, {
      status: 'converted',
      convertedToOrderId: orderId,
    })
  },

  async delete(id: string): Promise<boolean> {
    return quotesCollection.delete(id)
  },

  async search(query: string): Promise<Quote[]> {
    const lowerQuery = query.toLowerCase()
    return quotesCollection.query(q =>
      q.quoteNumber.toLowerCase().includes(lowerQuery) ||
      (q.partyName || '').toLowerCase().includes(lowerQuery) ||
      (q.notes || '').toLowerCase().includes(lowerQuery)
    )
  },

  async getByType(type: QuoteType): Promise<Quote[]> {
    return quotesCollection.query(q => q.type === type)
  },

  async getByStatus(status: QuoteStatus): Promise<Quote[]> {
    return quotesCollection.query(q => q.status === status)
  },

  async getByParty(partyId: string): Promise<Quote[]> {
    return quotesCollection.query(q => q.partyId === partyId)
  },

  async getSalesQuotes(): Promise<Quote[]> {
    return quoteService.getByType('sales')
  },

  async getPurchaseQuotes(): Promise<Quote[]> {
    return quoteService.getByType('purchase')
  },

  async getActiveQuotes(): Promise<Quote[]> {
    const today = new Date().toISOString().split('T')[0]
    return quotesCollection.query(q =>
      (q.status === 'draft' || q.status === 'sent' || q.status === 'accepted') &&
      q.validUntil >= today
    )
  },

  async getExpiredQuotes(): Promise<Quote[]> {
    const today = new Date().toISOString().split('T')[0]
    return quotesCollection.query(q =>
      q.status !== 'converted' &&
      q.status !== 'rejected' &&
      q.status !== 'expired' &&
      q.validUntil < today
    )
  },

  async getPendingConversion(): Promise<Quote[]> {
    return quotesCollection.query(q =>
      q.status === 'accepted' &&
      !q.convertedToOrderId
    )
  },

  async getStats(): Promise<{
    total: number
    salesTotal: number
    salesValue: number
    salesDraft: number
    salesSent: number
    salesAccepted: number
    salesConverted: number
    purchaseTotal: number
    purchaseValue: number
    purchaseDraft: number
    purchaseSent: number
    purchaseAccepted: number
    purchaseConverted: number
    expiredCount: number
    pendingConversion: number
  }> {
    const quotes = await quotesCollection.getAll()
    const sales = quotes.filter(q => q.type === 'sales')
    const purchase = quotes.filter(q => q.type === 'purchase')
    const today = new Date().toISOString().split('T')[0]

    const expiredCount = quotes.filter(q =>
      q.status !== 'converted' &&
      q.status !== 'rejected' &&
      q.status !== 'expired' &&
      q.validUntil < today
    ).length

    const pendingConversion = quotes.filter(q =>
      q.status === 'accepted' &&
      !q.convertedToOrderId
    ).length

    return {
      total: quotes.length,
      salesTotal: sales.length,
      salesValue: sales.reduce((sum, q) => sum + q.subtotal, 0),
      salesDraft: sales.filter(q => q.status === 'draft').length,
      salesSent: sales.filter(q => q.status === 'sent').length,
      salesAccepted: sales.filter(q => q.status === 'accepted').length,
      salesConverted: sales.filter(q => q.status === 'converted').length,
      purchaseTotal: purchase.length,
      purchaseValue: purchase.reduce((sum, q) => sum + q.subtotal, 0),
      purchaseDraft: purchase.filter(q => q.status === 'draft').length,
      purchaseSent: purchase.filter(q => q.status === 'sent').length,
      purchaseAccepted: purchase.filter(q => q.status === 'accepted').length,
      purchaseConverted: purchase.filter(q => q.status === 'converted').length,
      expiredCount,
      pendingConversion,
    }
  },

  // Check and auto-expire quotes that have passed their valid date
  async checkAndExpireQuotes(): Promise<number> {
    const quotes = await quotesCollection.getAll()
    const today = new Date().toISOString().split('T')[0]
    let expiredCount = 0

    for (const quote of quotes) {
      if (
        (quote.status === 'draft' || quote.status === 'sent') &&
        quote.validUntil < today
      ) {
        await quoteService.markAsExpired(quote.id)
        expiredCount++
      }
    }

    return expiredCount
  },

  async reset(): Promise<void> {
    await quotesCollection.clear()
    // Data will be re-seeded on next storage initialization
  },
}
