import type { FinancialAccount, FinancialTransaction } from '../types'
import { financialAccountsCollection, financialTransactionsCollection } from '../storage'
import { generateId } from '../schema'

export const financialAccountService = {
  // ============ Account Methods ============

  async getAll(): Promise<FinancialAccount[]> {
    return financialAccountsCollection.getAll()
  },

  async getActive(): Promise<FinancialAccount[]> {
    return financialAccountsCollection.query(a => a.isActive)
  },

  async getById(id: string): Promise<FinancialAccount | undefined> {
    return financialAccountsCollection.getById(id)
  },

  async create(data: Omit<FinancialAccount, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<FinancialAccount> {
    const now = new Date().toISOString()
    const newAccount: FinancialAccount = {
      ...data,
      id: generateId('fa'),
      createdBy: 'Current User',
      createdAt: now,
      updatedAt: now,
    }
    await financialAccountsCollection.create(newAccount)
    return newAccount
  },

  async update(id: string, data: Partial<FinancialAccount>): Promise<FinancialAccount | undefined> {
    const existing = await financialAccountsCollection.getById(id)
    if (!existing) return undefined

    const updated: FinancialAccount = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    }
    return financialAccountsCollection.update(id, updated)
  },

  async void(id: string): Promise<FinancialAccount | undefined> {
    return financialAccountService.update(id, { isActive: false })
  },

  async restore(id: string): Promise<FinancialAccount | undefined> {
    return financialAccountService.update(id, { isActive: true })
  },

  async search(query: string): Promise<FinancialAccount[]> {
    const lowerQuery = query.toLowerCase()
    return financialAccountsCollection.query(a =>
      a.name.toLowerCase().includes(lowerQuery) ||
      (a.institution || '').toLowerCase().includes(lowerQuery) ||
      (a.accountNumber || '').includes(lowerQuery)
    )
  },

  async getByType(type: FinancialAccount['type']): Promise<FinancialAccount[]> {
    return financialAccountsCollection.query(a => a.type === type && a.isActive)
  },

  // ============ Transaction Methods ============

  async getTransactions(accountId: string): Promise<FinancialTransaction[]> {
    const transactions = await financialTransactionsCollection.query(t => t.accountId === accountId)
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  async getAllTransactions(): Promise<FinancialTransaction[]> {
    return financialTransactionsCollection.getAll()
  },

  async createTransaction(data: Omit<FinancialTransaction, 'id' | 'createdAt'>): Promise<FinancialTransaction | undefined> {
    const account = await financialAccountService.getById(data.accountId)
    if (!account) return undefined

    const now = new Date().toISOString()
    const newTransaction: FinancialTransaction = {
      ...data,
      id: generateId('ft'),
      createdAt: now,
    }

    await financialTransactionsCollection.create(newTransaction)

    // Update account balance
    const balanceChange = data.type === 'credit' ? data.amount : -data.amount
    await financialAccountService.update(data.accountId, {
      balance: account.balance + balanceChange,
    })

    return newTransaction
  },

  async getTransactionById(id: string): Promise<FinancialTransaction | undefined> {
    return financialTransactionsCollection.getById(id)
  },

  // ============ Stats ============

  async getStats(): Promise<{
    totalAccounts: number
    totalBalance: number
    linkedCount: number
    lastSync: string | undefined
    byType: {
      checking: number
      savings: number
      cash: number
      credit: number
      investment: number
    }
  }> {
    const accounts = await financialAccountsCollection.query(a => a.isActive)

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
    const linkedCount = accounts.filter(a => a.isLinked).length
    const lastSync = accounts
      .filter(a => a.lastSyncedAt)
      .sort((a, b) => new Date(b.lastSyncedAt!).getTime() - new Date(a.lastSyncedAt!).getTime())[0]
      ?.lastSyncedAt

    return {
      totalAccounts: accounts.length,
      totalBalance,
      linkedCount,
      lastSync,
      byType: {
        checking: accounts.filter(a => a.type === 'checking').length,
        savings: accounts.filter(a => a.type === 'savings').length,
        cash: accounts.filter(a => a.type === 'cash').length,
        credit: accounts.filter(a => a.type === 'credit').length,
        investment: accounts.filter(a => a.type === 'investment').length,
      },
    }
  },

  async reset(): Promise<void> {
    await financialAccountsCollection.clear()
    await financialTransactionsCollection.clear()
    // Data will be re-seeded on next storage initialization
  },
}
