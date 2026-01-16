import type { PurchaseOrder, OrderStatus, OrderLineItem } from '../types'
import { purchaseOrdersCollection } from '../storage'
import { generateId } from '../schema'

const generateOrderNumber = async (): Promise<string> => {
  const orders = await purchaseOrdersCollection.getAll()
  const maxNum = orders.reduce((max, order) => {
    const match = order.orderNumber.match(/PO-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)
  return `PO-${(maxNum + 1).toString().padStart(4, '0')}`
}

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    return purchaseOrdersCollection.getAll()
  },

  async getById(id: string): Promise<PurchaseOrder | undefined> {
    return purchaseOrdersCollection.getById(id)
  },

  async getByOrderNumber(orderNumber: string): Promise<PurchaseOrder | undefined> {
    const orders = await purchaseOrdersCollection.query(o => o.orderNumber === orderNumber)
    return orders[0]
  },

  async getByStatus(status: OrderStatus): Promise<PurchaseOrder[]> {
    return purchaseOrdersCollection.query(o => o.status === status)
  },

  async getBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return purchaseOrdersCollection.query(o => o.supplierId === supplierId)
  },

  async search(query: string): Promise<PurchaseOrder[]> {
    const lowerQuery = query.toLowerCase()
    return purchaseOrdersCollection.query(o =>
      o.orderNumber.toLowerCase().includes(lowerQuery) ||
      (o.supplierName?.toLowerCase().includes(lowerQuery) ?? false) ||
      (o.notes?.toLowerCase().includes(lowerQuery) ?? false)
    )
  },

  async create(data: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<PurchaseOrder> {
    const now = new Date().toISOString()
    const newOrder: PurchaseOrder = {
      ...data,
      id: generateId('po'),
      orderNumber: await generateOrderNumber(),
      createdBy: 'current-user',
      createdAt: now,
      updatedAt: now,
    }
    await purchaseOrdersCollection.create(newOrder)
    return newOrder
  },

  async update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const existing = await purchaseOrdersCollection.getById(id)
    if (!existing) return undefined

    const updated: PurchaseOrder = {
      ...existing,
      ...data,
      id,
      orderNumber: existing.orderNumber, // Prevent changing order number
      updatedAt: new Date().toISOString(),
    }
    return purchaseOrdersCollection.update(id, updated)
  },

  async updateStatus(id: string, status: OrderStatus): Promise<PurchaseOrder | undefined> {
    return this.update(id, { status })
  },

  async addLineItem(orderId: string, lineItem: Omit<OrderLineItem, 'id'>): Promise<PurchaseOrder | undefined> {
    const order = await this.getById(orderId)
    if (!order) return undefined

    const newLineItem: OrderLineItem = {
      ...lineItem,
      id: generateId('li'),
    }

    const updatedLineItems = [...order.lineItems, newLineItem]
    const subtotal = updatedLineItems.reduce((sum, item) => sum + item.totalPrice, 0)

    return this.update(orderId, { lineItems: updatedLineItems, subtotal })
  },

  async updateLineItem(orderId: string, lineItemId: string, data: Partial<OrderLineItem>): Promise<PurchaseOrder | undefined> {
    const order = await this.getById(orderId)
    if (!order) return undefined

    const updatedLineItems = order.lineItems.map(item =>
      item.id === lineItemId ? { ...item, ...data } : item
    )
    const subtotal = updatedLineItems.reduce((sum, item) => sum + item.totalPrice, 0)

    return this.update(orderId, { lineItems: updatedLineItems, subtotal })
  },

  async removeLineItem(orderId: string, lineItemId: string): Promise<PurchaseOrder | undefined> {
    const order = await this.getById(orderId)
    if (!order) return undefined

    const updatedLineItems = order.lineItems.filter(item => item.id !== lineItemId)
    const subtotal = updatedLineItems.reduce((sum, item) => sum + item.totalPrice, 0)

    return this.update(orderId, { lineItems: updatedLineItems, subtotal })
  },

  async delete(id: string): Promise<boolean> {
    return purchaseOrdersCollection.delete(id)
  },

  async voidOrder(id: string): Promise<PurchaseOrder | undefined> {
    return this.updateStatus(id, 'voided')
  },

  async getStats(): Promise<{
    total: number
    open: number
    inProgress: number
    fulfilled: number
    closed: number
    voided: number
    totalValue: number
  }> {
    const orders = await purchaseOrdersCollection.getAll()
    return {
      total: orders.length,
      open: orders.filter(o => o.status === 'open').length,
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      fulfilled: orders.filter(o => o.status === 'fulfilled').length,
      closed: orders.filter(o => o.status === 'closed').length,
      voided: orders.filter(o => o.status === 'voided').length,
      totalValue: orders.filter(o => o.status !== 'voided').reduce((sum, o) => sum + o.subtotal, 0),
    }
  },

  async reset(): Promise<void> {
    await purchaseOrdersCollection.clear()
    // Data will be re-seeded on next storage initialization
  },

  /**
   * Get purchase orders that are available for linking to a brokered order.
   * Filters out orders that are already linked to a BO or voided.
   * @param excludeIds - IDs to exclude (already linked to the current BO)
   */
  async getAvailableForLinking(excludeIds: string[] = []): Promise<PurchaseOrder[]> {
    return purchaseOrdersCollection.query(o =>
      !o.brokeredOrderId &&
      o.status !== 'voided' &&
      !excludeIds.includes(o.id)
    )
  },

  /**
   * Get purchase orders linked to a specific brokered order.
   */
  async getByBrokeredOrderId(brokeredOrderId: string): Promise<PurchaseOrder[]> {
    return purchaseOrdersCollection.query(o => o.brokeredOrderId === brokeredOrderId)
  },
}
