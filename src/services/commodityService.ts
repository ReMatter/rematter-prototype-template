import type { Commodity, PriceListItem, CommodityWithPrice, CommodityCategory } from '../types'
import { commoditiesCollection, priceListCollection } from '../storage'
import { generateId } from '../schema'

export const commodityService = {
  // Commodities CRUD
  async getAllCommodities(): Promise<Commodity[]> {
    return commoditiesCollection.getAll()
  },

  async getCommodityById(id: string): Promise<Commodity | undefined> {
    return commoditiesCollection.getById(id)
  },

  async getCommoditiesByCategory(category: CommodityCategory): Promise<Commodity[]> {
    return commoditiesCollection.query(m => m.category === category)
  },

  async searchCommodities(query: string): Promise<Commodity[]> {
    const lowerQuery = query.toLowerCase()
    return commoditiesCollection.query(m =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.code.toLowerCase().includes(lowerQuery) ||
      (m.description?.toLowerCase().includes(lowerQuery) ?? false)
    )
  },

  async createCommodity(data: Omit<Commodity, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Commodity> {
    const now = new Date().toISOString()
    const newCommodity: Commodity = {
      ...data,
      id: generateId('com'),
      createdBy: 'current-user',
      createdAt: now,
      updatedAt: now,
    }
    await commoditiesCollection.create(newCommodity)
    return newCommodity
  },

  async updateCommodity(id: string, data: Partial<Commodity>): Promise<Commodity | undefined> {
    const existing = await commoditiesCollection.getById(id)
    if (!existing) return undefined

    const updated: Commodity = {
      ...existing,
      ...data,
      id, // Prevent ID from being changed
      updatedAt: new Date().toISOString(),
    }
    return commoditiesCollection.update(id, updated)
  },

  async deleteCommodity(id: string): Promise<boolean> {
    const existing = await commoditiesCollection.getById(id)
    if (!existing) return false

    // Delete associated prices
    const prices = await priceListCollection.query(p => p.commodityId === id)
    for (const price of prices) {
      await priceListCollection.delete(price.id)
    }

    return commoditiesCollection.delete(id)
  },

  // Price List CRUD
  async getAllPrices(): Promise<PriceListItem[]> {
    return priceListCollection.getAll()
  },

  async getCurrentPrice(commodityId: string): Promise<PriceListItem | undefined> {
    const now = new Date().toISOString()
    const prices = await priceListCollection.query(p => p.commodityId === commodityId)
    return prices
      .filter(p => p.effectiveDate <= now && (!p.expirationDate || p.expirationDate > now))
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0]
  },

  async updatePrice(commodityId: string, buyPrice: number, sellPrice: number): Promise<PriceListItem> {
    const prices = await priceListCollection.query(p => p.commodityId === commodityId)
    const existing = prices[0]
    const commodity = await this.getCommodityById(commodityId)
    const now = new Date().toISOString()

    const priceItem: PriceListItem = {
      id: existing ? existing.id : generateId('price'),
      commodityId,
      buyPrice,
      sellPrice,
      unit: commodity?.defaultUnit || 'LB',
      currency: 'USD',
      effectiveDate: now.split('T')[0],
      createdBy: existing ? existing.createdBy : 'current-user',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    }

    if (existing) {
      await priceListCollection.update(existing.id, priceItem)
    } else {
      await priceListCollection.create(priceItem)
    }

    return priceItem
  },

  // Combined view - only commodities that have prices set
  async getCommoditiesWithPrices(): Promise<CommodityWithPrice[]> {
    const commodities = await this.getAllCommodities()
    const result: CommodityWithPrice[] = []

    for (const m of commodities) {
      const price = await this.getCurrentPrice(m.id)
      if (price) {
        const margin = price.sellPrice - price.buyPrice
        const marginPercent = price.buyPrice > 0 ? (margin / price.buyPrice) * 100 : 0

        result.push({
          ...m,
          currentBuyPrice: price.buyPrice,
          currentSellPrice: price.sellPrice,
          priceCurrency: price.currency,
          margin,
          marginPercent,
        })
      }
    }

    return result
  },

  // Get commodities that are NOT on the price list (no prices set)
  async getCommoditiesWithoutPrices(): Promise<Commodity[]> {
    const commodities = await this.getAllCommodities()
    const result: Commodity[] = []

    for (const m of commodities) {
      const price = await this.getCurrentPrice(m.id)
      if (!price) {
        result.push(m)
      }
    }

    return result
  },

  // Remove commodity from price list (delete its price entry)
  async removeFromPriceList(commodityId: string): Promise<boolean> {
    const prices = await priceListCollection.query(p => p.commodityId === commodityId)
    for (const price of prices) {
      await priceListCollection.delete(price.id)
    }
    return prices.length > 0
  },

  // Reset to initial data (useful for development)
  async reset(): Promise<void> {
    await commoditiesCollection.clear()
    await priceListCollection.clear()
    // Data will be re-seeded on next storage initialization
  },
}
