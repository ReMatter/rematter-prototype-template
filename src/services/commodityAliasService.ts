import type { CommodityAlias, CommodityAliasWithDetails, CommodityAliasType } from '../types'
import { commodityAliasesCollection, commoditiesCollection, accountsCollection } from '../storage'
import { generateId } from '../schema'

export const commodityAliasService = {
  // Basic CRUD operations
  async getAllAliases(): Promise<CommodityAlias[]> {
    return commodityAliasesCollection.getAll()
  },

  async getAliasById(id: string): Promise<CommodityAlias | undefined> {
    return commodityAliasesCollection.getById(id)
  },

  async createAlias(data: Omit<CommodityAlias, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<CommodityAlias> {
    const now = new Date().toISOString()
    const newAlias: CommodityAlias = {
      ...data,
      id: generateId('malias'),
      createdBy: 'current-user',
      createdAt: now,
      updatedAt: now,
    }
    await commodityAliasesCollection.create(newAlias)
    return newAlias
  },

  async updateAlias(id: string, data: Partial<CommodityAlias>): Promise<CommodityAlias | undefined> {
    const existing = await commodityAliasesCollection.getById(id)
    if (!existing) return undefined

    const updated: CommodityAlias = {
      ...existing,
      ...data,
      id, // Prevent ID from being changed
      updatedAt: new Date().toISOString(),
    }
    return commodityAliasesCollection.update(id, updated)
  },

  async deleteAlias(id: string): Promise<boolean> {
    const existing = await commodityAliasesCollection.getById(id)
    if (!existing) return false
    return commodityAliasesCollection.delete(id)
  },

  // Query by commodity
  async getAliasesForCommodity(commodityId: string): Promise<CommodityAlias[]> {
    return commodityAliasesCollection.query(alias => alias.commodityId === commodityId)
  },

  // Query by account
  async getAliasesForAccount(accountId: string): Promise<CommodityAlias[]> {
    return commodityAliasesCollection.query(alias => alias.accountId === accountId)
  },

  // Query by commodity and account
  async getAliasForCommodityAndAccount(commodityId: string, accountId: string): Promise<CommodityAlias | undefined> {
    const aliases = await commodityAliasesCollection.query(
      alias => alias.commodityId === commodityId && alias.accountId === accountId
    )
    return aliases[0]
  },

  // Get aliases with commodity and account details
  async getAliasesWithDetails(filters?: { commodityId?: string; accountId?: string }): Promise<CommodityAliasWithDetails[]> {
    let aliases = await this.getAllAliases()

    if (filters?.commodityId) {
      aliases = aliases.filter(a => a.commodityId === filters.commodityId)
    }
    if (filters?.accountId) {
      aliases = aliases.filter(a => a.accountId === filters.accountId)
    }

    const result: CommodityAliasWithDetails[] = []
    for (const alias of aliases) {
      const commodity = await commoditiesCollection.getById(alias.commodityId)
      const account = await accountsCollection.getById(alias.accountId)

      result.push({
        ...alias,
        commodityName: commodity?.name || 'Unknown Commodity',
        commodityCode: commodity?.code || '',
        accountName: account?.name || 'Unknown Account',
      })
    }

    return result
  },

  // Name resolution logic
  // Priority: 1) Per-account alias, 2) Default buy/sell name, 3) Inventory name
  async resolveCommodityName(
    commodityId: string,
    accountId: string,
    type: CommodityAliasType
  ): Promise<{ name: string; code: string }> {
    // 1. Check for per-account alias
    const alias = await this.getAliasForCommodityAndAccount(commodityId, accountId)
    if (alias) {
      return {
        name: alias.aliasName,
        code: alias.aliasCode || '',
      }
    }

    // 2. Check for default buy/sell name on commodity
    const commodity = await commoditiesCollection.getById(commodityId)
    if (!commodity) {
      return { name: 'Unknown Commodity', code: '' }
    }

    if (type === 'buy' && commodity.defaultBuyAsName) {
      return {
        name: commodity.defaultBuyAsName,
        code: commodity.defaultBuyAsCode || commodity.code,
      }
    }

    if (type === 'sell' && commodity.defaultSellAsName) {
      return {
        name: commodity.defaultSellAsName,
        code: commodity.defaultSellAsCode || commodity.code,
      }
    }

    // 3. Fall back to inventory name
    return {
      name: commodity.name,
      code: commodity.code,
    }
  },

  // Bulk resolve names for multiple commodities
  async resolveCommodityNames(
    items: { commodityId: string; accountId: string; type: CommodityAliasType }[]
  ): Promise<Map<string, { name: string; code: string }>> {
    const results = new Map<string, { name: string; code: string }>()

    for (const item of items) {
      const key = `${item.commodityId}-${item.accountId}-${item.type}`
      const resolved = await this.resolveCommodityName(item.commodityId, item.accountId, item.type)
      results.set(key, resolved)
    }

    return results
  },

  // Check if a commodity-account-type combination already has an alias
  async aliasExists(commodityId: string, accountId: string): Promise<boolean> {
    const alias = await this.getAliasForCommodityAndAccount(commodityId, accountId)
    return !!alias
  },

  // Delete all aliases for a commodity (used when deleting a commodity)
  async deleteAliasesForCommodity(commodityId: string): Promise<number> {
    const aliases = await this.getAliasesForCommodity(commodityId)
    let count = 0
    for (const alias of aliases) {
      if (await this.deleteAlias(alias.id)) {
        count++
      }
    }
    return count
  },

  // Delete all aliases for an account (used when deleting an account)
  async deleteAliasesForAccount(accountId: string): Promise<number> {
    const aliases = await this.getAliasesForAccount(accountId)
    let count = 0
    for (const alias of aliases) {
      if (await this.deleteAlias(alias.id)) {
        count++
      }
    }
    return count
  },

  // Reset (clear all aliases)
  async reset(): Promise<void> {
    await commodityAliasesCollection.clear()
  },
}
