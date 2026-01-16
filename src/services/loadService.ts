import type { Load, LoadStatus } from '../types'
import { loadsCollection } from '../storage'
import { generateId } from '../schema'

const generateLoadNumber = async (): Promise<string> => {
  const loads = await loadsCollection.getAll()
  const maxNum = loads.reduce((max, load) => {
    const match = load.loadNumber.match(/LD-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)
  return `LD-${(maxNum + 1).toString().padStart(4, '0')}`
}

export const loadService = {
  async getAll(): Promise<Load[]> {
    return loadsCollection.getAll()
  },

  async getById(id: string): Promise<Load | undefined> {
    return loadsCollection.getById(id)
  },

  async getByLoadNumber(loadNumber: string): Promise<Load | undefined> {
    const loads = await loadsCollection.query(l => l.loadNumber === loadNumber)
    return loads[0]
  },

  async create(loadData: Omit<Load, 'id' | 'loadNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Load> {
    const now = new Date().toISOString()
    const newLoad: Load = {
      ...loadData,
      id: generateId('load'),
      loadNumber: await generateLoadNumber(),
      documents: loadData.documents || [],
      createdBy: 'Current User',
      createdAt: now,
      updatedAt: now,
    }
    await loadsCollection.create(newLoad)
    return newLoad
  },

  async update(id: string, updates: Partial<Load>): Promise<Load | undefined> {
    const existing = await loadsCollection.getById(id)
    if (!existing) return undefined

    const updated: Load = {
      ...existing,
      ...updates,
      id,
      loadNumber: existing.loadNumber, // Prevent changing load number
      updatedAt: new Date().toISOString(),
    }
    return loadsCollection.update(id, updated)
  },

  async updateStatus(id: string, status: LoadStatus): Promise<Load | undefined> {
    const updates: Partial<Load> = { status }

    // Set actual dates based on status
    if (status === 'picked_up') {
      updates.actualPickupDate = new Date().toISOString().split('T')[0]
    } else if (status === 'delivered') {
      updates.actualDeliveryDate = new Date().toISOString().split('T')[0]
    }

    return loadService.update(id, updates)
  },

  async markPickedUp(id: string, actualWeight?: number): Promise<Load | undefined> {
    const updates: Partial<Load> = {
      status: 'picked_up',
      actualPickupDate: new Date().toISOString().split('T')[0],
    }
    if (actualWeight !== undefined) {
      updates.actualWeight = actualWeight
    }
    return loadService.update(id, updates)
  },

  async markDelivered(id: string, actualWeight?: number): Promise<Load | undefined> {
    const updates: Partial<Load> = {
      status: 'delivered',
      actualDeliveryDate: new Date().toISOString().split('T')[0],
    }
    if (actualWeight !== undefined) {
      updates.actualWeight = actualWeight
    }
    return loadService.update(id, updates)
  },

  async markCompleted(id: string): Promise<Load | undefined> {
    return loadService.updateStatus(id, 'completed')
  },

  async cancelLoad(id: string): Promise<Load | undefined> {
    return loadService.updateStatus(id, 'cancelled')
  },

  async delete(id: string): Promise<boolean> {
    return loadsCollection.delete(id)
  },

  async search(query: string): Promise<Load[]> {
    const lowerQuery = query.toLowerCase()
    return loadsCollection.query(l =>
      l.loadNumber.toLowerCase().includes(lowerQuery) ||
      (l.brokeredOrderNumber || '').toLowerCase().includes(lowerQuery) ||
      (l.carrierName || '').toLowerCase().includes(lowerQuery) ||
      (l.originPartyName || '').toLowerCase().includes(lowerQuery) ||
      (l.destinationPartyName || '').toLowerCase().includes(lowerQuery) ||
      (l.commodityName || '').toLowerCase().includes(lowerQuery) ||
      (l.bolNumber || '').toLowerCase().includes(lowerQuery)
    )
  },

  async getByStatus(status: LoadStatus): Promise<Load[]> {
    return loadsCollection.query(l => l.status === status)
  },

  async getByCarrier(carrierId: string): Promise<Load[]> {
    return loadsCollection.query(l => l.carrierId === carrierId)
  },

  async getByBrokeredOrder(brokeredOrderId: string): Promise<Load[]> {
    return loadsCollection.query(l => l.brokeredOrderId === brokeredOrderId)
  },

  async getActiveLoads(): Promise<Load[]> {
    return loadsCollection.query(l =>
      l.status === 'scheduled' ||
      l.status === 'picked_up' ||
      l.status === 'in_transit'
    )
  },

  async getStats(): Promise<{
    total: number
    scheduled: number
    pickedUp: number
    inTransit: number
    delivered: number
    completed: number
    cancelled: number
    totalFreightCost: number
    totalEstimatedWeight: number
    totalActualWeight: number
  }> {
    const loads = await loadsCollection.getAll()
    const activeLoads = loads.filter(l => l.status !== 'cancelled')

    return {
      total: loads.length,
      scheduled: loads.filter(l => l.status === 'scheduled').length,
      pickedUp: loads.filter(l => l.status === 'picked_up').length,
      inTransit: loads.filter(l => l.status === 'in_transit').length,
      delivered: loads.filter(l => l.status === 'delivered').length,
      completed: loads.filter(l => l.status === 'completed').length,
      cancelled: loads.filter(l => l.status === 'cancelled').length,
      totalFreightCost: activeLoads.reduce((sum, l) => sum + (l.freightCost || 0), 0),
      totalEstimatedWeight: activeLoads.reduce((sum, l) => sum + l.estimatedWeight, 0),
      totalActualWeight: activeLoads
        .filter(l => l.actualWeight)
        .reduce((sum, l) => sum + (l.actualWeight || 0), 0),
    }
  },

  async getUpcomingPickups(days: number = 7): Promise<Load[]> {
    const loads = await loadsCollection.getAll()
    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + days)

    return loads.filter(l => {
      if (l.status !== 'scheduled') return false
      const pickupDate = new Date(l.scheduledPickupDate)
      return pickupDate >= now && pickupDate <= future
    })
  },

  async getOverdueLoads(): Promise<Load[]> {
    const loads = await loadsCollection.getAll()
    const today = new Date().toISOString().split('T')[0]

    return loads.filter(l => {
      if (l.status === 'completed' || l.status === 'cancelled' || l.status === 'delivered') {
        return false
      }
      if (l.status === 'scheduled' && l.scheduledPickupDate < today) {
        return true
      }
      if ((l.status === 'picked_up' || l.status === 'in_transit') && l.scheduledDeliveryDate < today) {
        return true
      }
      return false
    })
  },

  async reset(): Promise<void> {
    await loadsCollection.clear()
    // Data will be re-seeded on next storage initialization
  },
}
