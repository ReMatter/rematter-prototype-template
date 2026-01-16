// Pricing Service - Multi-dimensional pricing system

import type {
  PricingGroup,
  PriceList,
  NewPriceListItem,
  PricingDirection,
  CommodityPrice,
  PricingGroupWithStats,
  PriceListWithItems,
  PriceListItem,
  Account,
  Commodity,
} from '../types'
import {
  pricingGroupsCollection,
  priceListsCollection,
  priceListItemsCollection,
  priceListCollection,
  accountsCollection,
  commoditiesCollection,
} from '../storage'
import { createPricingGroup, createNewPriceList, createNewPriceListItem } from '../schema'

export const pricingService = {
  // ============================================================
  // Pricing Groups
  // ============================================================

  async getAllPricingGroups(): Promise<PricingGroup[]> {
    return pricingGroupsCollection.getAll()
  },

  async getPricingGroupById(id: string): Promise<PricingGroup | undefined> {
    return pricingGroupsCollection.getById(id)
  },

  async getPricingGroupsByDirection(direction: PricingDirection): Promise<PricingGroup[]> {
    return pricingGroupsCollection.query(g => g.direction === direction)
  },

  async getDefaultPricingGroup(direction: PricingDirection): Promise<PricingGroup | undefined> {
    const groups = await pricingGroupsCollection.query(
      g => g.direction === direction && g.isDefault === true
    )
    return groups[0]
  },

  async createPricingGroup(
    data: Omit<PricingGroup, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<PricingGroup> {
    // If this is being set as default, unset other defaults in the same direction
    if (data.isDefault) {
      await this.clearDefaultForDirection(data.direction)
    }

    const newGroup = createPricingGroup(data)
    await pricingGroupsCollection.create(newGroup)
    return newGroup
  },

  async updatePricingGroup(
    id: string,
    data: Partial<PricingGroup>
  ): Promise<PricingGroup | undefined> {
    const existing = await pricingGroupsCollection.getById(id)
    if (!existing) return undefined

    // If setting as default, unset other defaults
    if (data.isDefault && !existing.isDefault) {
      await this.clearDefaultForDirection(existing.direction)
    }

    const updated: PricingGroup = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    }
    return pricingGroupsCollection.update(id, updated)
  },

  async deletePricingGroup(id: string): Promise<boolean> {
    // Check if any accounts are assigned to this group
    const accounts = await accountsCollection.query(
      a => a.buyPricingGroupId === id || a.sellPricingGroupId === id
    )
    if (accounts.length > 0) {
      throw new Error(`Cannot delete pricing group: ${accounts.length} account(s) are assigned to it`)
    }

    // Delete all price lists and items in this group
    const priceLists = await priceListsCollection.query(pl => pl.pricingGroupId === id)
    for (const priceList of priceLists) {
      await this.deletePriceList(priceList.id)
    }

    return pricingGroupsCollection.delete(id)
  },

  async setAsDefault(id: string): Promise<PricingGroup | undefined> {
    const group = await pricingGroupsCollection.getById(id)
    if (!group) return undefined

    await this.clearDefaultForDirection(group.direction)
    return this.updatePricingGroup(id, { isDefault: true })
  },

  async clearDefaultForDirection(direction: PricingDirection): Promise<void> {
    const defaultGroups = await pricingGroupsCollection.query(
      g => g.direction === direction && g.isDefault === true
    )
    for (const group of defaultGroups) {
      await pricingGroupsCollection.update(group.id, {
        ...group,
        isDefault: false,
        updatedAt: new Date().toISOString(),
      })
    }
  },

  // Get pricing groups with statistics
  async getPricingGroupsWithStats(): Promise<PricingGroupWithStats[]> {
    const groups = await this.getAllPricingGroups()
    const result: PricingGroupWithStats[] = []

    for (const group of groups) {
      const priceLists = await priceListsCollection.query(pl => pl.pricingGroupId === group.id)

      // Count unique commodities across all price lists
      const commodityIds = new Set<string>()
      for (const priceList of priceLists) {
        const items = await priceListItemsCollection.query(item => item.priceListId === priceList.id)
        items.forEach(item => commodityIds.add(item.commodityId))
      }

      // Count accounts assigned to this group
      const accounts = await accountsCollection.query(a => {
        if (group.direction === 'buy') {
          return a.buyPricingGroupId === group.id
        } else {
          return a.sellPricingGroupId === group.id
        }
      })

      result.push({
        ...group,
        priceListCount: priceLists.length,
        commodityCount: commodityIds.size,
        accountCount: accounts.length,
      })
    }

    return result
  },

  // ============================================================
  // Price Lists
  // ============================================================

  async getAllPriceLists(): Promise<PriceList[]> {
    return priceListsCollection.getAll()
  },

  async getPriceListById(id: string): Promise<PriceList | undefined> {
    return priceListsCollection.getById(id)
  },

  async getPriceListsByGroup(pricingGroupId: string): Promise<PriceList[]> {
    return priceListsCollection.query(pl => pl.pricingGroupId === pricingGroupId)
  },

  async getActivePriceListsForDate(pricingGroupId: string, date: string): Promise<PriceList[]> {
    const priceLists = await priceListsCollection.query(pl =>
      pl.pricingGroupId === pricingGroupId && pl.isActive === true
    )

    return priceLists.filter(pl => {
      const isEffective = pl.effectiveDate <= date
      const isNotExpired = !pl.expirationDate || pl.expirationDate > date
      return isEffective && isNotExpired
    })
  },

  async createPriceList(
    data: Omit<PriceList, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<PriceList> {
    const newPriceList = createNewPriceList(data)
    await priceListsCollection.create(newPriceList)
    return newPriceList
  },

  async updatePriceList(id: string, data: Partial<PriceList>): Promise<PriceList | undefined> {
    const existing = await priceListsCollection.getById(id)
    if (!existing) return undefined

    const updated: PriceList = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    }
    return priceListsCollection.update(id, updated)
  },

  async deletePriceList(id: string): Promise<boolean> {
    // Delete all items in this price list
    const items = await priceListItemsCollection.query(item => item.priceListId === id)
    for (const item of items) {
      await priceListItemsCollection.delete(item.id)
    }

    return priceListsCollection.delete(id)
  },

  // Get price list with its items
  async getPriceListWithItems(id: string): Promise<PriceListWithItems | undefined> {
    const priceList = await priceListsCollection.getById(id)
    if (!priceList) return undefined

    const items = await priceListItemsCollection.query(item => item.priceListId === id)
    const group = await pricingGroupsCollection.getById(priceList.pricingGroupId)

    return {
      ...priceList,
      items,
      pricingGroupName: group?.name,
      pricingGroupDirection: group?.direction,
    }
  },

  // ============================================================
  // Price List Items
  // ============================================================

  async getAllPriceListItems(): Promise<NewPriceListItem[]> {
    return priceListItemsCollection.getAll()
  },

  async getPriceListItemById(id: string): Promise<NewPriceListItem | undefined> {
    return priceListItemsCollection.getById(id)
  },

  async getItemsByPriceList(priceListId: string): Promise<NewPriceListItem[]> {
    return priceListItemsCollection.query(item => item.priceListId === priceListId)
  },

  async createPriceListItem(
    data: Omit<NewPriceListItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<NewPriceListItem> {
    // Validate commodity uniqueness
    const validation = await this.validateCommodityUniqueness(
      data.priceListId,
      data.commodityId
    )
    if (!validation.valid) {
      throw new Error(
        `Commodity already has a price in "${validation.conflictingPriceList?.name}" for overlapping dates`
      )
    }

    const newItem = createNewPriceListItem(data)
    await priceListItemsCollection.create(newItem)
    return newItem
  },

  async updatePriceListItem(
    id: string,
    data: Partial<NewPriceListItem>
  ): Promise<NewPriceListItem | undefined> {
    const existing = await priceListItemsCollection.getById(id)
    if (!existing) return undefined

    // If changing commodity, validate uniqueness
    if (data.commodityId && data.commodityId !== existing.commodityId) {
      const validation = await this.validateCommodityUniqueness(
        existing.priceListId,
        data.commodityId,
        id
      )
      if (!validation.valid) {
        throw new Error(
          `Commodity already has a price in "${validation.conflictingPriceList?.name}" for overlapping dates`
        )
      }
    }

    const updated: NewPriceListItem = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    }
    return priceListItemsCollection.update(id, updated)
  },

  async deletePriceListItem(id: string): Promise<boolean> {
    return priceListItemsCollection.delete(id)
  },

  // ============================================================
  // Validation
  // ============================================================

  // Validates that a commodity doesn't have overlapping prices within the same pricing group
  async validateCommodityUniqueness(
    priceListId: string,
    commodityId: string,
    excludeItemId?: string
  ): Promise<{ valid: boolean; conflictingPriceList?: PriceList }> {
    const priceList = await priceListsCollection.getById(priceListId)
    if (!priceList) return { valid: false }

    const allListsInGroup = await priceListsCollection.query(
      pl => pl.pricingGroupId === priceList.pricingGroupId
    )

    for (const otherList of allListsInGroup) {
      if (otherList.id === priceListId) continue

      // Check date overlap
      const hasOverlap = this.datesOverlap(
        priceList.effectiveDate,
        priceList.expirationDate,
        otherList.effectiveDate,
        otherList.expirationDate
      )

      if (hasOverlap) {
        const items = await priceListItemsCollection.query(
          item => item.priceListId === otherList.id
        )
        const conflictingItem = items.find(
          item => item.commodityId === commodityId && item.id !== excludeItemId
        )
        if (conflictingItem) {
          return { valid: false, conflictingPriceList: otherList }
        }
      }
    }

    // Also check items in the current price list (for updates)
    const currentItems = await priceListItemsCollection.query(
      item => item.priceListId === priceListId && item.commodityId === commodityId
    )
    const conflictInCurrent = currentItems.find(item => item.id !== excludeItemId)
    if (conflictInCurrent) {
      return { valid: false, conflictingPriceList: priceList }
    }

    return { valid: true }
  },

  // Check if two date ranges overlap
  datesOverlap(
    start1: string,
    end1: string | undefined,
    start2: string,
    end2: string | undefined
  ): boolean {
    // A period with no end date is treated as ongoing
    const effectiveEnd1 = end1 || '9999-12-31'
    const effectiveEnd2 = end2 || '9999-12-31'

    return start1 <= effectiveEnd2 && start2 <= effectiveEnd1
  },

  // ============================================================
  // Price Resolution (Critical Business Logic)
  // ============================================================

  // Get the price for a specific commodity and account
  async getPrice(
    accountId: string,
    commodityId: string,
    direction: PricingDirection,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<CommodityPrice | null> {
    const account = await accountsCollection.getById(accountId)
    if (!account) return null

    const commodity = await commoditiesCollection.getById(commodityId)
    if (!commodity) return null

    // Get account's assigned group
    const assignedGroupId = direction === 'buy'
      ? account.buyPricingGroupId
      : account.sellPricingGroupId

    // Try assigned group first
    if (assignedGroupId) {
      const price = await this.findPriceInGroup(assignedGroupId, commodity, date)
      if (price) return price
    }

    // Fall back to default group
    const defaultGroup = await this.getDefaultPricingGroup(direction)
    if (defaultGroup) {
      return this.findPriceInGroup(defaultGroup.id, commodity, date)
    }

    return null
  },

  // Find price for a commodity within a specific group
  async findPriceInGroup(
    groupId: string,
    commodity: Commodity,
    date: string
  ): Promise<CommodityPrice | null> {
    const group = await pricingGroupsCollection.getById(groupId)
    if (!group) return null

    const priceLists = await this.getActivePriceListsForDate(groupId, date)

    // Sort by effectiveDate descending (most recent first)
    priceLists.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))

    for (const priceList of priceLists) {
      const items = await priceListItemsCollection.query(
        item => item.priceListId === priceList.id
      )
      const item = items.find(i => i.commodityId === commodity.id)

      if (item) {
        return {
          commodityId: commodity.id,
          commodityName: commodity.name,
          commodityCode: commodity.code,
          price: item.price,
          unit: item.unit,
          currency: item.currency,
          priceListId: priceList.id,
          priceListName: priceList.name,
          pricingGroupId: group.id,
          pricingGroupName: group.name,
          effectiveDate: priceList.effectiveDate,
          expirationDate: priceList.expirationDate,
        }
      }
    }

    return null
  },

  // Get all prices for an account
  async getPricesForAccount(
    accountId: string,
    direction: PricingDirection,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<CommodityPrice[]> {
    const account = await accountsCollection.getById(accountId)
    if (!account) return []

    const commodities = await commoditiesCollection.getAll()
    const activeCommodities = commodities.filter(c => c.isActive)

    const prices: CommodityPrice[] = []
    for (const commodity of activeCommodities) {
      const price = await this.getPrice(accountId, commodity.id, direction, date)
      if (price) {
        prices.push(price)
      }
    }

    return prices
  },

  // Get all resolved prices for a pricing group (for display)
  async getResolvedPricesForGroup(
    groupId: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<CommodityPrice[]> {
    const group = await pricingGroupsCollection.getById(groupId)
    if (!group) return []

    const commodities = await commoditiesCollection.getAll()
    const activeCommodities = commodities.filter(c => c.isActive)

    const prices: CommodityPrice[] = []
    for (const commodity of activeCommodities) {
      const price = await this.findPriceInGroup(groupId, commodity, date)
      if (price) {
        prices.push(price)
      }
    }

    return prices
  },

  // ============================================================
  // Account Assignment
  // ============================================================

  async getAccountsByPricingGroup(groupId: string): Promise<Account[]> {
    const group = await pricingGroupsCollection.getById(groupId)
    if (!group) return []

    return accountsCollection.query(a => {
      if (group.direction === 'buy') {
        return a.buyPricingGroupId === groupId
      } else {
        return a.sellPricingGroupId === groupId
      }
    })
  },

  async assignAccountToPricingGroup(
    accountId: string,
    groupId: string
  ): Promise<Account | undefined> {
    const account = await accountsCollection.getById(accountId)
    if (!account) return undefined

    const group = await pricingGroupsCollection.getById(groupId)
    if (!group) return undefined

    const update: Partial<Account> = group.direction === 'buy'
      ? { buyPricingGroupId: groupId }
      : { sellPricingGroupId: groupId }

    const updated: Account = {
      ...account,
      ...update,
      updatedAt: new Date().toISOString(),
    }
    return accountsCollection.update(accountId, updated)
  },

  async removeAccountFromPricingGroup(
    accountId: string,
    direction: PricingDirection
  ): Promise<Account | undefined> {
    const account = await accountsCollection.getById(accountId)
    if (!account) return undefined

    const update: Partial<Account> = direction === 'buy'
      ? { buyPricingGroupId: undefined }
      : { sellPricingGroupId: undefined }

    const updated: Account = {
      ...account,
      ...update,
      updatedAt: new Date().toISOString(),
    }
    return accountsCollection.update(accountId, updated)
  },

  // ============================================================
  // Migration from Legacy Pricing
  // ============================================================

  /**
   * Migrate legacy PriceListItem data to new pricing system
   * - Creates default buy/sell pricing groups if needed
   * - Creates price lists with legacy data
   * - Splits buyPrice/sellPrice into separate price list items
   */
  async migrateFromLegacyPricing(legacyPriceList: PriceListItem[]): Promise<{
    success: boolean
    migratedCount: number
    errors: string[]
  }> {
    const errors: string[] = []
    let migratedCount = 0

    if (legacyPriceList.length === 0) {
      return { success: true, migratedCount: 0, errors: [] }
    }

    try {
      // Ensure default pricing groups exist
      let buyDefaultGroup = await this.getDefaultPricingGroup('buy')
      if (!buyDefaultGroup) {
        buyDefaultGroup = await this.createPricingGroup({
          name: 'Standard Supplier Pricing',
          direction: 'buy',
          description: 'Default pricing for all suppliers (migrated from legacy)',
          isDefault: true,
          isActive: true,
        })
      }

      let sellDefaultGroup = await this.getDefaultPricingGroup('sell')
      if (!sellDefaultGroup) {
        sellDefaultGroup = await this.createPricingGroup({
          name: 'Standard Customer Pricing',
          direction: 'sell',
          description: 'Default pricing for all customers (migrated from legacy)',
          isDefault: true,
          isActive: true,
        })
      }

      // Find date range from legacy data
      const dates = legacyPriceList.map(item => item.effectiveDate).sort()
      const earliestDate = dates[0] || new Date().toISOString().split('T')[0]

      // Check if we already have price lists (avoid duplicate migration)
      const existingBuyLists = await this.getPriceListsByGroup(buyDefaultGroup.id)
      const existingSellLists = await this.getPriceListsByGroup(sellDefaultGroup.id)

      // Only migrate if groups have no price lists yet
      const shouldMigrateBuy = existingBuyLists.length === 0
      const shouldMigrateSell = existingSellLists.length === 0

      // Create buy price list if needed
      let buyPriceList: PriceList | null = null
      if (shouldMigrateBuy) {
        buyPriceList = await this.createPriceList({
          pricingGroupId: buyDefaultGroup.id,
          name: 'Migrated Buy Prices',
          effectiveDate: earliestDate,
          expirationDate: undefined, // Open-ended
          notes: 'Migrated from legacy pricing system',
          isActive: true,
        })
      }

      // Create sell price list if needed
      let sellPriceList: PriceList | null = null
      if (shouldMigrateSell) {
        sellPriceList = await this.createPriceList({
          pricingGroupId: sellDefaultGroup.id,
          name: 'Migrated Sell Prices',
          effectiveDate: earliestDate,
          expirationDate: undefined, // Open-ended
          notes: 'Migrated from legacy pricing system',
          isActive: true,
        })
      }

      // Migrate each legacy price item
      for (const legacyItem of legacyPriceList) {
        try {
          // Create buy price item
          if (buyPriceList && legacyItem.buyPrice > 0) {
            await this.createPriceListItem({
              priceListId: buyPriceList.id,
              commodityId: legacyItem.commodityId,
              price: legacyItem.buyPrice,
              unit: legacyItem.unit,
              currency: legacyItem.currency,
              notes: legacyItem.notes,
            })
            migratedCount++
          }

          // Create sell price item
          if (sellPriceList && legacyItem.sellPrice > 0) {
            await this.createPriceListItem({
              priceListId: sellPriceList.id,
              commodityId: legacyItem.commodityId,
              price: legacyItem.sellPrice,
              unit: legacyItem.unit,
              currency: legacyItem.currency,
              notes: legacyItem.notes,
            })
            migratedCount++
          }
        } catch (err) {
          errors.push(`Failed to migrate commodity ${legacyItem.commodityId}: ${err}`)
        }
      }

      return {
        success: errors.length === 0,
        migratedCount,
        errors,
      }
    } catch (err) {
      return {
        success: false,
        migratedCount,
        errors: [...errors, `Migration failed: ${err}`],
      }
    }
  },

  /**
   * Check if migration from legacy pricing is needed
   */
  async needsLegacyMigration(): Promise<boolean> {
    // Check if we have legacy price list items
    const legacyItems = await priceListCollection.getAll()
    if (legacyItems.length === 0) return false

    // Check if we already have new price list items
    const newItems = await priceListItemsCollection.getAll()
    if (newItems.length > 0) return false // Already migrated or using new system

    return true
  },
}
