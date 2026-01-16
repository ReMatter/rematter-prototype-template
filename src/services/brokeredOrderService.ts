import type { BrokeredOrder, BrokeredOrderStatus } from '../types'
import { brokeredOrdersCollection, purchaseOrdersCollection, salesOrdersCollection } from '../storage'
import { generateId } from '../schema'

// ============================================================================
// Validation Types & Functions
// ============================================================================

export interface OrderLinkingValidation {
  valid: boolean
  error?: string
}

export interface LinkResult {
  success: boolean
  error?: string
  warning?: string
}

// Helper to get PO/SO IDs from a brokered order (handling legacy fields)
const getLinkedPOIds = (order: BrokeredOrder): string[] => {
  return order.purchaseOrderIds || (order.purchaseOrderId ? [order.purchaseOrderId] : [])
}

const getLinkedSOIds = (order: BrokeredOrder): string[] => {
  return order.salesOrderIds || (order.salesOrderId ? [order.salesOrderId] : [])
}

/**
 * Validate the linking pattern between POs and SOs.
 * Rules:
 * - If >1 PO, must have exactly 1 SO (many suppliers to one customer)
 * - If >1 SO, must have exactly 1 PO (one supplier to many customers)
 */
export function validateLinkingPattern(
  poCount: number,
  soCount: number
): OrderLinkingValidation {
  // Allow empty or single on either side
  if (poCount <= 1 && soCount <= 1) {
    return { valid: true }
  }

  // If multiple POs, must have exactly 1 SO
  if (poCount > 1 && soCount !== 1) {
    return {
      valid: false,
      error: 'When linking multiple Purchase Orders, exactly one Sales Order is required.',
    }
  }

  // If multiple SOs, must have exactly 1 PO
  if (soCount > 1 && poCount !== 1) {
    return {
      valid: false,
      error: 'When linking multiple Sales Orders, exactly one Purchase Order is required.',
    }
  }

  return { valid: true }
}

/**
 * Check if adding orders would result in a valid linking pattern.
 */
export function validateAddingOrders(
  currentPOCount: number,
  currentSOCount: number,
  addingPOCount: number,
  addingSOCount: number
): OrderLinkingValidation {
  return validateLinkingPattern(
    currentPOCount + addingPOCount,
    currentSOCount + addingSOCount
  )
}

/**
 * Find which brokered order (if any) a PO is linked to.
 */
async function findBrokeredOrderForPO(poId: string): Promise<BrokeredOrder | undefined> {
  const allBOs = await brokeredOrdersCollection.getAll()
  return allBOs.find(bo => {
    const poIds = getLinkedPOIds(bo)
    return poIds.includes(poId)
  })
}

/**
 * Find which brokered order (if any) a SO is linked to.
 */
async function findBrokeredOrderForSO(soId: string): Promise<BrokeredOrder | undefined> {
  const allBOs = await brokeredOrdersCollection.getAll()
  return allBOs.find(bo => {
    const soIds = getLinkedSOIds(bo)
    return soIds.includes(soId)
  })
}

const generateOrderNumber = async (): Promise<string> => {
  const orders = await brokeredOrdersCollection.getAll()
  const maxNum = orders.reduce((max, order) => {
    const match = order.orderNumber.match(/BO-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)
  return `BO-${(maxNum + 1).toString().padStart(4, '0')}`
}

export const brokeredOrderService = {
  async getAll(): Promise<BrokeredOrder[]> {
    return brokeredOrdersCollection.getAll()
  },

  async getById(id: string): Promise<BrokeredOrder | undefined> {
    return brokeredOrdersCollection.getById(id)
  },

  async getByOrderNumber(orderNumber: string): Promise<BrokeredOrder | undefined> {
    const orders = await brokeredOrdersCollection.query(o => o.orderNumber === orderNumber)
    return orders[0]
  },

  async create(orderData: Omit<BrokeredOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<BrokeredOrder> {
    const now = new Date().toISOString()
    const newOrder: BrokeredOrder = {
      ...orderData,
      id: generateId('bo'),
      orderNumber: await generateOrderNumber(),
      createdBy: 'Current User',
      createdAt: now,
      updatedAt: now,
    }
    await brokeredOrdersCollection.create(newOrder)
    return newOrder
  },

  async update(id: string, updates: Partial<BrokeredOrder>): Promise<BrokeredOrder | undefined> {
    const existing = await brokeredOrdersCollection.getById(id)
    if (!existing) return undefined

    const updated: BrokeredOrder = {
      ...existing,
      ...updates,
      id,
      orderNumber: existing.orderNumber, // Prevent changing order number
      updatedAt: new Date().toISOString(),
    }
    return brokeredOrdersCollection.update(id, updated)
  },

  async updateStatus(id: string, status: BrokeredOrderStatus): Promise<BrokeredOrder | undefined> {
    return brokeredOrderService.update(id, { status })
  },

  async voidOrder(id: string): Promise<BrokeredOrder | undefined> {
    return brokeredOrderService.updateStatus(id, 'voided')
  },

  async closeOrder(id: string): Promise<BrokeredOrder | undefined> {
    return brokeredOrderService.updateStatus(id, 'closed')
  },

  async delete(id: string): Promise<boolean> {
    return brokeredOrdersCollection.delete(id)
  },

  async search(query: string): Promise<BrokeredOrder[]> {
    const lowerQuery = query.toLowerCase()
    return brokeredOrdersCollection.query(o =>
      o.orderNumber.toLowerCase().includes(lowerQuery) ||
      (o.purchaseOrderNumber || '').toLowerCase().includes(lowerQuery) ||
      (o.salesOrderNumber || '').toLowerCase().includes(lowerQuery) ||
      (o.supplierName || '').toLowerCase().includes(lowerQuery) ||
      (o.customerName || '').toLowerCase().includes(lowerQuery) ||
      (o.commodityName || '').toLowerCase().includes(lowerQuery)
    )
  },

  async getByStatus(status: BrokeredOrderStatus): Promise<BrokeredOrder[]> {
    return brokeredOrdersCollection.query(o => o.status === status)
  },

  async getBySupplier(supplierId: string): Promise<BrokeredOrder[]> {
    return brokeredOrdersCollection.query(o => o.supplierId === supplierId)
  },

  async getByCustomer(customerId: string): Promise<BrokeredOrder[]> {
    return brokeredOrdersCollection.query(o => o.customerId === customerId)
  },

  async getByCommodity(commodityId: string): Promise<BrokeredOrder[]> {
    return brokeredOrdersCollection.query(o => o.commodityId === commodityId)
  },

  async getStats(): Promise<{
    total: number
    open: number
    inProgress: number
    fulfilled: number
    closed: number
    voided: number
    totalPurchaseValue: number
    totalSalesValue: number
    totalMargin: number
    avgMarginPercent: number
  }> {
    const orders = await brokeredOrdersCollection.getAll()
    const activeOrders = orders.filter(o => o.status !== 'voided' && o.status !== 'closed')

    return {
      total: orders.length,
      open: orders.filter(o => o.status === 'open').length,
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      fulfilled: orders.filter(o => o.status === 'fulfilled').length,
      closed: orders.filter(o => o.status === 'closed').length,
      voided: orders.filter(o => o.status === 'voided').length,
      totalPurchaseValue: activeOrders.reduce((sum, o) => sum + o.purchaseTotal, 0),
      totalSalesValue: activeOrders.reduce((sum, o) => sum + o.salesTotal, 0),
      totalMargin: activeOrders.reduce((sum, o) => sum + o.margin, 0),
      avgMarginPercent: activeOrders.length > 0
        ? activeOrders.reduce((sum, o) => sum + o.marginPercent, 0) / activeOrders.length
        : 0,
    }
  },

  async addLoad(orderId: string, loadId: string): Promise<BrokeredOrder | undefined> {
    const order = await brokeredOrderService.getById(orderId)
    if (!order) return undefined

    const loadIds = [...order.loadIds]
    if (!loadIds.includes(loadId)) {
      loadIds.push(loadId)
    }

    return brokeredOrderService.update(orderId, { loadIds })
  },

  async removeLoad(orderId: string, loadId: string): Promise<BrokeredOrder | undefined> {
    const order = await brokeredOrderService.getById(orderId)
    if (!order) return undefined

    const loadIds = order.loadIds.filter(id => id !== loadId)
    return brokeredOrderService.update(orderId, { loadIds })
  },

  async reset(): Promise<void> {
    await brokeredOrdersCollection.clear()
    // Data will be re-seeded on next storage initialization
  },

  // ==========================================================================
  // Order Linking Methods
  // ==========================================================================

  /**
   * Link purchase orders to a brokered order.
   * Validates:
   * - Each PO is not already linked to another BO
   * - The resulting pattern is valid (N:1 or 1:N, not N:N)
   */
  async linkPurchaseOrders(brokeredOrderId: string, poIds: string[]): Promise<LinkResult> {
    const order = await brokeredOrderService.getById(brokeredOrderId)
    if (!order) {
      return { success: false, error: 'Brokered order not found' }
    }

    // Check if any PO is already linked to another BO
    for (const poId of poIds) {
      const po = await purchaseOrdersCollection.getById(poId)
      if (!po) {
        return { success: false, error: `Purchase order ${poId} not found` }
      }

      // Check via brokeredOrderId field on the PO
      if (po.brokeredOrderId && po.brokeredOrderId !== brokeredOrderId) {
        const existingBO = await brokeredOrderService.getById(po.brokeredOrderId)
        return {
          success: false,
          error: `${po.orderNumber} is already linked to ${existingBO?.orderNumber || 'another brokered order'}`,
        }
      }

      // Also check via BO's purchaseOrderIds (for data integrity)
      const linkedBO = await findBrokeredOrderForPO(poId)
      if (linkedBO && linkedBO.id !== brokeredOrderId) {
        return {
          success: false,
          error: `${po.orderNumber} is already linked to ${linkedBO.orderNumber}`,
        }
      }
    }

    // Validate linking pattern
    const currentPOIds = getLinkedPOIds(order)
    const currentSOIds = getLinkedSOIds(order)
    const validation = validateAddingOrders(
      currentPOIds.length,
      currentSOIds.length,
      poIds.length,
      0
    )
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Update the BO with new PO IDs
    const newPOIds = [...currentPOIds, ...poIds]
    await brokeredOrderService.update(brokeredOrderId, { purchaseOrderIds: newPOIds })

    // Update each PO with brokeredOrderId
    for (const poId of poIds) {
      const po = await purchaseOrdersCollection.getById(poId)
      if (po) {
        await purchaseOrdersCollection.update(poId, {
          ...po,
          brokeredOrderId,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return { success: true }
  },

  /**
   * Link sales orders to a brokered order.
   * Validates:
   * - Each SO is not already linked to another BO
   * - The resulting pattern is valid (N:1 or 1:N, not N:N)
   */
  async linkSalesOrders(brokeredOrderId: string, soIds: string[]): Promise<LinkResult> {
    const order = await brokeredOrderService.getById(brokeredOrderId)
    if (!order) {
      return { success: false, error: 'Brokered order not found' }
    }

    // Check if any SO is already linked to another BO
    for (const soId of soIds) {
      const so = await salesOrdersCollection.getById(soId)
      if (!so) {
        return { success: false, error: `Sales order ${soId} not found` }
      }

      // Check via brokeredOrderId field on the SO
      if (so.brokeredOrderId && so.brokeredOrderId !== brokeredOrderId) {
        const existingBO = await brokeredOrderService.getById(so.brokeredOrderId)
        return {
          success: false,
          error: `${so.orderNumber} is already linked to ${existingBO?.orderNumber || 'another brokered order'}`,
        }
      }

      // Also check via BO's salesOrderIds (for data integrity)
      const linkedBO = await findBrokeredOrderForSO(soId)
      if (linkedBO && linkedBO.id !== brokeredOrderId) {
        return {
          success: false,
          error: `${so.orderNumber} is already linked to ${linkedBO.orderNumber}`,
        }
      }
    }

    // Validate linking pattern
    const currentPOIds = getLinkedPOIds(order)
    const currentSOIds = getLinkedSOIds(order)
    const validation = validateAddingOrders(
      currentPOIds.length,
      currentSOIds.length,
      0,
      soIds.length
    )
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Update the BO with new SO IDs
    const newSOIds = [...currentSOIds, ...soIds]
    await brokeredOrderService.update(brokeredOrderId, { salesOrderIds: newSOIds })

    // Update each SO with brokeredOrderId
    for (const soId of soIds) {
      const so = await salesOrdersCollection.getById(soId)
      if (so) {
        await salesOrdersCollection.update(soId, {
          ...so,
          brokeredOrderId,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return { success: true }
  },

  /**
   * Unlink a purchase order from a brokered order.
   * Returns a warning if the resulting pattern is invalid.
   */
  async unlinkPurchaseOrder(brokeredOrderId: string, poId: string): Promise<LinkResult> {
    const order = await brokeredOrderService.getById(brokeredOrderId)
    if (!order) {
      return { success: false, error: 'Brokered order not found' }
    }

    const currentPOIds = getLinkedPOIds(order)
    if (!currentPOIds.includes(poId)) {
      return { success: false, error: 'Purchase order is not linked to this brokered order' }
    }

    // Remove the PO from the BO
    const newPOIds = currentPOIds.filter(id => id !== poId)
    await brokeredOrderService.update(brokeredOrderId, { purchaseOrderIds: newPOIds })

    // Clear brokeredOrderId from the PO
    const po = await purchaseOrdersCollection.getById(poId)
    if (po) {
      await purchaseOrdersCollection.update(poId, {
        ...po,
        brokeredOrderId: undefined,
        updatedAt: new Date().toISOString(),
      })
    }

    // Check if the resulting pattern is valid and warn if not
    const currentSOIds = getLinkedSOIds(order)
    const validation = validateLinkingPattern(newPOIds.length, currentSOIds.length)
    if (!validation.valid) {
      return {
        success: true,
        warning: `Brokered order is now in an invalid state: ${validation.error}`,
      }
    }

    return { success: true }
  },

  /**
   * Unlink a sales order from a brokered order.
   * Returns a warning if the resulting pattern is invalid.
   */
  async unlinkSalesOrder(brokeredOrderId: string, soId: string): Promise<LinkResult> {
    const order = await brokeredOrderService.getById(brokeredOrderId)
    if (!order) {
      return { success: false, error: 'Brokered order not found' }
    }

    const currentSOIds = getLinkedSOIds(order)
    if (!currentSOIds.includes(soId)) {
      return { success: false, error: 'Sales order is not linked to this brokered order' }
    }

    // Remove the SO from the BO
    const newSOIds = currentSOIds.filter(id => id !== soId)
    await brokeredOrderService.update(brokeredOrderId, { salesOrderIds: newSOIds })

    // Clear brokeredOrderId from the SO
    const so = await salesOrdersCollection.getById(soId)
    if (so) {
      await salesOrdersCollection.update(soId, {
        ...so,
        brokeredOrderId: undefined,
        updatedAt: new Date().toISOString(),
      })
    }

    // Check if the resulting pattern is valid and warn if not
    const currentPOIds = getLinkedPOIds(order)
    const validation = validateLinkingPattern(currentPOIds.length, newSOIds.length)
    if (!validation.valid) {
      return {
        success: true,
        warning: `Brokered order is now in an invalid state: ${validation.error}`,
      }
    }

    return { success: true }
  },

  /**
   * Get constraint info for UI to determine if more POs can be added.
   */
  getConstraintsForPO(order: BrokeredOrder): { canAdd: boolean; maxSelectable?: number; message?: string } {
    const poCount = getLinkedPOIds(order).length
    const soCount = getLinkedSOIds(order).length

    // If we have multiple SOs, we can only have 1 PO
    if (soCount > 1) {
      if (poCount >= 1) {
        return {
          canAdd: false,
          message: 'Cannot add more Purchase Orders when multiple Sales Orders are linked',
        }
      }
      return {
        canAdd: true,
        maxSelectable: 1,
        message: 'Only one Purchase Order allowed when multiple Sales Orders are linked',
      }
    }

    // Otherwise, we can add multiple POs (but only if we have 0 or 1 SO)
    return { canAdd: true }
  },

  /**
   * Get constraint info for UI to determine if more SOs can be added.
   */
  getConstraintsForSO(order: BrokeredOrder): { canAdd: boolean; maxSelectable?: number; message?: string } {
    const poCount = getLinkedPOIds(order).length
    const soCount = getLinkedSOIds(order).length

    // If we have multiple POs, we can only have 1 SO
    if (poCount > 1) {
      if (soCount >= 1) {
        return {
          canAdd: false,
          message: 'Cannot add more Sales Orders when multiple Purchase Orders are linked',
        }
      }
      return {
        canAdd: true,
        maxSelectable: 1,
        message: 'Only one Sales Order allowed when multiple Purchase Orders are linked',
      }
    }

    // Otherwise, we can add multiple SOs (but only if we have 0 or 1 PO)
    return { canAdd: true }
  },
}
