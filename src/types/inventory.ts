import type { AuditFields, WeightUnit } from './common'

// Types of inventory movements
export type InventoryMovementType =
  | 'po_incoming'    // Expected receipt from Purchase Order
  | 'so_outgoing'    // Committed shipment to Sales Order
  | 'load_pickup'    // Picked up from supplier
  | 'load_delivery'  // Delivered to customer
  | 'adjustment'     // Manual inventory adjustment

// A projected or actual movement of inventory
export interface InventoryMovement {
  id: string
  type: InventoryMovementType
  commodityId: string
  commodityName?: string
  locationId?: string
  locationName?: string
  quantity: number           // positive = in, negative = out
  unit: WeightUnit
  expectedDate: string       // From Load or Order fallback (ISO date)
  actualDate?: string        // When it actually occurred
  sourceId: string           // PO/SO/Load ID
  sourceType: 'purchaseOrder' | 'salesOrder' | 'load'
  sourceNumber?: string      // PO-0001, SO-0001, LD-0001
  partyName?: string         // Supplier or Customer name
  status: 'pending' | 'completed' | 'cancelled'
}

// Calculated position for a commodity at a location
export interface Position {
  id: string                 // Unique identifier: commodityId-locationId
  commodityId: string
  commodityCode?: string
  commodityName?: string
  locationId?: string        // undefined = company-wide
  locationName?: string
  currentInventory: number   // What's physically on hand
  incoming: number           // From open POs (not yet received)
  outgoing: number           // From open SOs (not yet shipped)
  netPosition: number        // current + incoming - outgoing
  unit: WeightUnit
}

// A single entry in the position timeline for charting
export interface PositionTimelineEntry {
  date: string               // ISO date
  position: number           // Net position on this date
  incoming: number           // Total incoming on this date
  outgoing: number           // Total outgoing on this date
  movements: InventoryMovement[]  // All movements on this date
}

// Manual inventory adjustment record
export interface InventoryAdjustment extends AuditFields {
  id: string
  adjustmentNumber: string   // ADJ-0001
  commodityId: string
  commodityCode?: string
  commodityName?: string
  locationId?: string
  locationName?: string
  adjustmentType: 'count' | 'damage' | 'transfer_in' | 'transfer_out' | 'other'
  quantity: number           // The adjustment amount (can be negative)
  unit: WeightUnit
  reason?: string
  adjustmentDate: string     // ISO date
}

// Position warning for alerts
export interface PositionWarning {
  commodityId: string
  commodityCode?: string
  commodityName?: string
  locationId?: string
  locationName?: string
  warningType: 'negative' | 'low' | 'oversold'
  currentPosition: number
  projectedPosition: number
  shortfallDate?: string     // When the position goes negative
  shortfallAmount?: number
  unit: WeightUnit
}

// Result of availability check
export interface AvailabilityCheck {
  available: boolean
  currentInventory: number
  incoming: number
  outgoing: number
  currentPosition: number
  projectedPosition: number
  shortfall: number          // Amount needed if not available
}
