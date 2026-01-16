import type {
  Position,
  InventoryMovement,
  InventoryAdjustment,
  PositionTimelineEntry,
  PositionWarning,
  AvailabilityCheck,
  PurchaseOrder,
  SalesOrder,
  Load,
  Commodity,
  WeightUnit,
} from '../types'
import {
  purchaseOrdersCollection,
  salesOrdersCollection,
  loadsCollection,
  commoditiesCollection,
  inventoryAdjustmentsCollection,
  accountsCollection,
} from '../storage'
import { generateId } from '../schema'

// Generate adjustment number
const generateAdjustmentNumber = async (): Promise<string> => {
  const adjustments = await inventoryAdjustmentsCollection.getAll()
  const maxNum = adjustments.reduce((max, adj) => {
    const match = adj.adjustmentNumber.match(/ADJ-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)
  return `ADJ-${(maxNum + 1).toString().padStart(4, '0')}`
}

// Get expected date for a movement based on Load or Order fallback
function getExpectedDate(
  load: Load | undefined,
  order: PurchaseOrder | SalesOrder,
  movementType: 'pickup' | 'delivery'
): string {
  // Priority 1: Use Load's actual date if completed
  if (load) {
    if (movementType === 'pickup' && load.actualPickupDate) {
      return load.actualPickupDate
    }
    if (movementType === 'delivery' && load.actualDeliveryDate) {
      return load.actualDeliveryDate
    }
    // Priority 2: Use Load's scheduled date
    if (movementType === 'pickup' && load.scheduledPickupDate) {
      return load.scheduledPickupDate
    }
    if (movementType === 'delivery' && load.scheduledDeliveryDate) {
      return load.scheduledDeliveryDate
    }
  }
  // Priority 3: Fallback to order dates
  return order.endDate || order.startDate || new Date().toISOString().split('T')[0]
}

// Calculate current inventory for a commodity from adjustments
async function getCurrentInventory(
  commodityId: string,
  locationId?: string
): Promise<number> {
  const adjustments = await inventoryAdjustmentsCollection.query(adj => {
    if (adj.commodityId !== commodityId) return false
    if (locationId && adj.locationId !== locationId) return false
    return true
  })

  return adjustments.reduce((sum, adj) => sum + adj.quantity, 0)
}

// Calculate incoming quantity from open POs
async function calculateIncoming(
  commodityId: string,
  locationId?: string,
  byDate?: string
): Promise<{ total: number; movements: InventoryMovement[] }> {
  const pos = await purchaseOrdersCollection.query(po =>
    po.status !== 'voided' && po.status !== 'closed'
  )
  const loads = await loadsCollection.getAll()

  let total = 0
  const movements: InventoryMovement[] = []

  for (const po of pos) {
    // Location filtering based on PO's facility
    if (locationId && po.facilityId !== locationId) continue

    for (const item of po.lineItems) {
      if (item.commodityId !== commodityId) continue

      const ordered = item.quantity
      const received = item.receivedQuantity || 0
      const pending = ordered - received

      if (pending <= 0) continue

      // Find linked loads for this PO
      const linkedLoads = loads.filter(l => l.purchaseOrderId === po.id)
      const linkedLoad = linkedLoads.length > 0 ? linkedLoads[0] : undefined

      const expectedDate = getExpectedDate(linkedLoad, po, 'delivery')

      // Filter by date if specified
      if (byDate && expectedDate > byDate) continue

      total += pending

      movements.push({
        id: `po-${po.id}-${item.id}`,
        type: 'po_incoming',
        commodityId: item.commodityId,
        commodityName: item.commodityName,
        locationId: po.facilityId,
        quantity: pending,
        unit: item.unit as WeightUnit,
        expectedDate,
        sourceId: po.id,
        sourceType: 'purchaseOrder',
        sourceNumber: po.orderNumber,
        partyName: po.supplierName,
        status: 'pending',
      })
    }
  }

  return { total, movements }
}

// Calculate outgoing quantity from open SOs
async function calculateOutgoing(
  commodityId: string,
  locationId?: string,
  byDate?: string
): Promise<{ total: number; movements: InventoryMovement[] }> {
  const sos = await salesOrdersCollection.query(so =>
    so.status !== 'voided' && so.status !== 'closed'
  )
  const loads = await loadsCollection.getAll()

  let total = 0
  const movements: InventoryMovement[] = []

  for (const so of sos) {
    // Location filtering based on SO's facility
    if (locationId && so.facilityId !== locationId) continue

    for (const item of so.lineItems) {
      if (item.commodityId !== commodityId) continue

      const ordered = item.quantity
      const shipped = item.shippedQuantity || 0
      const pending = ordered - shipped

      if (pending <= 0) continue

      // Find linked loads for this SO
      const linkedLoads = loads.filter(l => l.salesOrderId === so.id)
      const linkedLoad = linkedLoads.length > 0 ? linkedLoads[0] : undefined

      const expectedDate = getExpectedDate(linkedLoad, so, 'pickup')

      // Filter by date if specified
      if (byDate && expectedDate > byDate) continue

      total += pending

      movements.push({
        id: `so-${so.id}-${item.id}`,
        type: 'so_outgoing',
        commodityId: item.commodityId,
        commodityName: item.commodityName,
        locationId: so.facilityId,
        quantity: -pending, // Negative for outgoing
        unit: item.unit as WeightUnit,
        expectedDate,
        sourceId: so.id,
        sourceType: 'salesOrder',
        sourceNumber: so.orderNumber,
        partyName: so.customerName,
        status: 'pending',
      })
    }
  }

  return { total, movements }
}

// Get all unique commodities with pending movements
async function getCommoditiesWithMovements(): Promise<string[]> {
  const commodityIds = new Set<string>()

  // From adjustments
  const adjustments = await inventoryAdjustmentsCollection.getAll()
  adjustments.forEach(adj => commodityIds.add(adj.commodityId))

  // From POs
  const pos = await purchaseOrdersCollection.query(po =>
    po.status !== 'voided' && po.status !== 'closed'
  )
  pos.forEach(po => {
    po.lineItems.forEach(item => commodityIds.add(item.commodityId))
  })

  // From SOs
  const sos = await salesOrdersCollection.query(so =>
    so.status !== 'voided' && so.status !== 'closed'
  )
  sos.forEach(so => {
    so.lineItems.forEach(item => commodityIds.add(item.commodityId))
  })

  return Array.from(commodityIds)
}

export const inventoryService = {
  // Get all positions for a location (or company-wide if undefined)
  // Shows ALL active commodities, not just ones with movements
  async getPositions(locationId?: string): Promise<Position[]> {
    // Get ALL active commodities
    const commodities = await commoditiesCollection.query(c => c.isActive)

    const positions: Position[] = []

    for (const commodity of commodities) {
      const currentInventory = await getCurrentInventory(commodity.id, locationId)
      const { total: incoming } = await calculateIncoming(commodity.id, locationId)
      const { total: outgoing } = await calculateOutgoing(commodity.id, locationId)
      const netPosition = currentInventory + incoming - outgoing

      positions.push({
        id: `${commodity.id}-${locationId || 'all'}`,
        commodityId: commodity.id,
        commodityCode: commodity.code,
        commodityName: commodity.name,
        locationId,
        locationName: locationId ? undefined : 'Company-Wide',
        currentInventory,
        incoming,
        outgoing,
        netPosition,
        unit: (commodity.defaultUnit as WeightUnit) || 'LB',
      })
    }

    // Sort by commodity name
    return positions.sort((a, b) =>
      (a.commodityName || '').localeCompare(b.commodityName || '')
    )
  },

  // Get position for a specific commodity
  async getPosition(commodityId: string, locationId?: string): Promise<Position | null> {
    const commodity = await commoditiesCollection.getById(commodityId)
    if (!commodity) return null

    const currentInventory = await getCurrentInventory(commodityId, locationId)
    const { total: incoming } = await calculateIncoming(commodityId, locationId)
    const { total: outgoing } = await calculateOutgoing(commodityId, locationId)
    const netPosition = currentInventory + incoming - outgoing

    return {
      id: `${commodityId}-${locationId || 'all'}`,
      commodityId,
      commodityCode: commodity.code,
      commodityName: commodity.name,
      locationId,
      currentInventory,
      incoming,
      outgoing,
      netPosition,
      unit: (commodity.defaultUnit as WeightUnit) || 'LB',
    }
  },

  // Get all movements for a commodity
  async getMovements(
    commodityId: string,
    locationId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<InventoryMovement[]> {
    const { movements: incomingMovements } = await calculateIncoming(commodityId, locationId)
    const { movements: outgoingMovements } = await calculateOutgoing(commodityId, locationId)

    let allMovements = [...incomingMovements, ...outgoingMovements]

    // Filter by date range
    if (startDate) {
      allMovements = allMovements.filter(m => m.expectedDate >= startDate)
    }
    if (endDate) {
      allMovements = allMovements.filter(m => m.expectedDate <= endDate)
    }

    // Sort by date
    return allMovements.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate))
  },

  // Get position timeline for charting
  async getPositionTimeline(
    commodityId: string,
    locationId: string | undefined,
    startDate: string,
    endDate: string
  ): Promise<PositionTimelineEntry[]> {
    // Get current inventory as baseline
    const currentInventory = await getCurrentInventory(commodityId, locationId)

    // Get all movements in date range
    const movements = await this.getMovements(commodityId, locationId, startDate, endDate)

    // Group movements by date
    const movementsByDate = new Map<string, InventoryMovement[]>()
    movements.forEach(m => {
      const existing = movementsByDate.get(m.expectedDate) || []
      existing.push(m)
      movementsByDate.set(m.expectedDate, existing)
    })

    // Generate timeline entries for each day in range
    const timeline: PositionTimelineEntry[] = []
    let runningPosition = currentInventory

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayMovements = movementsByDate.get(dateStr) || []

      // Calculate position change for this day
      const dayIncoming = dayMovements
        .filter(m => m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0)
      const dayOutgoing = dayMovements
        .filter(m => m.quantity < 0)
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0)

      runningPosition += dayIncoming - dayOutgoing

      timeline.push({
        date: dateStr,
        position: runningPosition,
        incoming: dayIncoming,
        outgoing: dayOutgoing,
        movements: dayMovements,
      })
    }

    return timeline
  },

  // Check availability before SO creation
  async checkAvailability(
    commodityId: string,
    requiredQuantity: number,
    locationId?: string,
    byDate?: string
  ): Promise<AvailabilityCheck> {
    const currentInventory = await getCurrentInventory(commodityId, locationId)
    const { total: incoming } = await calculateIncoming(commodityId, locationId, byDate)
    const { total: outgoing } = await calculateOutgoing(commodityId, locationId, byDate)

    const currentPosition = currentInventory + incoming - outgoing
    const projectedPosition = currentPosition - requiredQuantity
    const shortfall = projectedPosition < 0 ? Math.abs(projectedPosition) : 0

    return {
      available: projectedPosition >= 0,
      currentInventory,
      incoming,
      outgoing,
      currentPosition,
      projectedPosition,
      shortfall,
    }
  },

  // Get position warnings (negative/low positions)
  async getPositionWarnings(locationId?: string): Promise<PositionWarning[]> {
    const positions = await this.getPositions(locationId)
    const warnings: PositionWarning[] = []

    for (const pos of positions) {
      if (pos.netPosition < 0) {
        warnings.push({
          commodityId: pos.commodityId,
          commodityCode: pos.commodityCode,
          commodityName: pos.commodityName,
          locationId: pos.locationId,
          locationName: pos.locationName,
          warningType: 'negative',
          currentPosition: pos.currentInventory,
          projectedPosition: pos.netPosition,
          shortfallAmount: Math.abs(pos.netPosition),
          unit: pos.unit,
        })
      } else if (pos.netPosition === 0 && pos.outgoing > 0) {
        // Position will be exactly zero with pending outgoing
        warnings.push({
          commodityId: pos.commodityId,
          commodityCode: pos.commodityCode,
          commodityName: pos.commodityName,
          locationId: pos.locationId,
          locationName: pos.locationName,
          warningType: 'low',
          currentPosition: pos.currentInventory,
          projectedPosition: pos.netPosition,
          unit: pos.unit,
        })
      }
    }

    return warnings
  },

  // ============================================================
  // Inventory Adjustment CRUD
  // ============================================================

  async getAdjustments(
    commodityId?: string,
    locationId?: string
  ): Promise<InventoryAdjustment[]> {
    let adjustments = await inventoryAdjustmentsCollection.getAll()

    if (commodityId) {
      adjustments = adjustments.filter(adj => adj.commodityId === commodityId)
    }
    if (locationId) {
      adjustments = adjustments.filter(adj => adj.locationId === locationId)
    }

    // Sort by date descending
    return adjustments.sort((a, b) =>
      b.adjustmentDate.localeCompare(a.adjustmentDate)
    )
  },

  async getAdjustmentById(id: string): Promise<InventoryAdjustment | undefined> {
    return inventoryAdjustmentsCollection.getById(id)
  },

  async createAdjustment(
    data: Omit<InventoryAdjustment, 'id' | 'adjustmentNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<InventoryAdjustment> {
    const now = new Date().toISOString()
    const adjustment: InventoryAdjustment = {
      ...data,
      id: generateId('adj'),
      adjustmentNumber: await generateAdjustmentNumber(),
      createdBy: 'Current User',
      createdAt: now,
      updatedAt: now,
    }
    await inventoryAdjustmentsCollection.create(adjustment)
    return adjustment
  },

  async updateAdjustment(
    id: string,
    updates: Partial<InventoryAdjustment>
  ): Promise<InventoryAdjustment | undefined> {
    const existing = await inventoryAdjustmentsCollection.getById(id)
    if (!existing) return undefined

    const updated: InventoryAdjustment = {
      ...existing,
      ...updates,
      id,
      adjustmentNumber: existing.adjustmentNumber, // Prevent changing
      updatedAt: new Date().toISOString(),
    }
    return inventoryAdjustmentsCollection.update(id, updated)
  },

  async deleteAdjustment(id: string): Promise<boolean> {
    return inventoryAdjustmentsCollection.delete(id)
  },

  // Quick adjustment - set inventory to a specific count
  async setInventoryCount(
    commodityId: string,
    newCount: number,
    locationId?: string,
    reason?: string
  ): Promise<InventoryAdjustment> {
    const commodity = await commoditiesCollection.getById(commodityId)
    const currentInventory = await getCurrentInventory(commodityId, locationId)
    const adjustmentAmount = newCount - currentInventory

    return this.createAdjustment({
      commodityId,
      commodityCode: commodity?.code,
      commodityName: commodity?.name,
      locationId,
      adjustmentType: 'count',
      quantity: adjustmentAmount,
      unit: (commodity?.defaultUnit as WeightUnit) || 'LB',
      reason: reason || `Inventory count adjustment to ${newCount}`,
      adjustmentDate: new Date().toISOString().split('T')[0],
    })
  },
}
