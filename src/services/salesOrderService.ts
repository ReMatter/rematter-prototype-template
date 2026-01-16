import type { SalesOrder, OrderStatus, SalesOrderType, OrderLineItem } from '../types'
import { salesOrdersCollection } from '../storage'
import { generateId } from '../schema'

const generateOrderNumber = async (): Promise<string> => {
  const orders = await salesOrdersCollection.getAll()
  const maxNum = orders.reduce((max, order) => {
    const match = order.orderNumber.match(/SO-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)
  return `SO-${(maxNum + 1).toString().padStart(4, '0')}`
}

export const salesOrderService = {
  async getAll(): Promise<SalesOrder[]> {
    return salesOrdersCollection.getAll()
  },

  async getById(id: string): Promise<SalesOrder | undefined> {
    return salesOrdersCollection.getById(id)
  },

  async getByOrderNumber(orderNumber: string): Promise<SalesOrder | undefined> {
    const orders = await salesOrdersCollection.query(o => o.orderNumber === orderNumber)
    return orders[0]
  },

  async getByStatus(status: OrderStatus): Promise<SalesOrder[]> {
    return salesOrdersCollection.query(o => o.status === status)
  },

  async getByType(type: SalesOrderType): Promise<SalesOrder[]> {
    return salesOrdersCollection.query(o => o.type === type)
  },

  async getByCustomer(customerId: string): Promise<SalesOrder[]> {
    return salesOrdersCollection.query(o => o.customerId === customerId)
  },

  async search(query: string): Promise<SalesOrder[]> {
    const lowerQuery = query.toLowerCase()
    return salesOrdersCollection.query(o =>
      o.orderNumber.toLowerCase().includes(lowerQuery) ||
      (o.customerName?.toLowerCase().includes(lowerQuery) ?? false) ||
      (o.counterpartyName?.toLowerCase().includes(lowerQuery) ?? false) ||
      (o.notes?.toLowerCase().includes(lowerQuery) ?? false)
    )
  },

  async create(data: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<SalesOrder> {
    const now = new Date().toISOString()
    const newOrder: SalesOrder = {
      ...data,
      id: generateId('so'),
      orderNumber: await generateOrderNumber(),
      createdBy: 'current-user',
      createdAt: now,
      updatedAt: now,
    }
    await salesOrdersCollection.create(newOrder)
    return newOrder
  },

  async update(id: string, data: Partial<SalesOrder>): Promise<SalesOrder | undefined> {
    const existing = await salesOrdersCollection.getById(id)
    if (!existing) return undefined

    const updated: SalesOrder = {
      ...existing,
      ...data,
      id,
      orderNumber: existing.orderNumber, // Prevent changing order number
      updatedAt: new Date().toISOString(),
    }
    return salesOrdersCollection.update(id, updated)
  },

  async updateStatus(id: string, status: OrderStatus): Promise<SalesOrder | undefined> {
    return this.update(id, { status })
  },

  async addLineItem(orderId: string, lineItem: Omit<OrderLineItem, 'id'>): Promise<SalesOrder | undefined> {
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

  async updateLineItem(orderId: string, lineItemId: string, data: Partial<OrderLineItem>): Promise<SalesOrder | undefined> {
    const order = await this.getById(orderId)
    if (!order) return undefined

    const updatedLineItems = order.lineItems.map(item =>
      item.id === lineItemId ? { ...item, ...data } : item
    )
    const subtotal = updatedLineItems.reduce((sum, item) => sum + item.totalPrice, 0)

    return this.update(orderId, { lineItems: updatedLineItems, subtotal })
  },

  async removeLineItem(orderId: string, lineItemId: string): Promise<SalesOrder | undefined> {
    const order = await this.getById(orderId)
    if (!order) return undefined

    const updatedLineItems = order.lineItems.filter(item => item.id !== lineItemId)
    const subtotal = updatedLineItems.reduce((sum, item) => sum + item.totalPrice, 0)

    return this.update(orderId, { lineItems: updatedLineItems, subtotal })
  },

  async delete(id: string): Promise<boolean> {
    return salesOrdersCollection.delete(id)
  },

  async voidOrder(id: string): Promise<SalesOrder | undefined> {
    return this.updateStatus(id, 'voided')
  },

  // Statistics
  async getStats(): Promise<{
    total: number
    open: number
    inProgress: number
    fulfilled: number
    closed: number
    voided: number
    totalValue: number
  }> {
    const orders = await salesOrdersCollection.getAll()
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

  // Reset data (useful for development)
  async reset(): Promise<void> {
    await salesOrdersCollection.clear()
    // Data will be re-seeded on next storage initialization
  },

  /**
   * Get sales orders that are available for linking to a brokered order.
   * Filters out orders that are already linked to a BO or voided.
   * @param excludeIds - IDs to exclude (already linked to the current BO)
   */
  async getAvailableForLinking(excludeIds: string[] = []): Promise<SalesOrder[]> {
    return salesOrdersCollection.query(o =>
      !o.brokeredOrderId &&
      o.status !== 'voided' &&
      !excludeIds.includes(o.id)
    )
  },

  /**
   * Get sales orders linked to a specific brokered order.
   */
  async getByBrokeredOrderId(brokeredOrderId: string): Promise<SalesOrder[]> {
    return salesOrdersCollection.query(o => o.brokeredOrderId === brokeredOrderId)
  },
}
