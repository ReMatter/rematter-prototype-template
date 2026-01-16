// Pricing types - Multi-dimensional pricing system

import type { WeightUnit, Currency, AuditFields } from './common';

// Direction of pricing - buy from suppliers or sell to customers
export type PricingDirection = 'buy' | 'sell';

// Pricing Group - a container for price lists
export interface PricingGroup extends AuditFields {
  id: string;
  name: string;
  direction: PricingDirection;
  description?: string;
  isDefault: boolean;  // Only one per direction can be true
  isActive: boolean;
}

// Price List - has date range, belongs to a pricing group
export interface PriceList extends AuditFields {
  id: string;
  pricingGroupId: string;
  name: string;
  effectiveDate: string;      // ISO date string YYYY-MM-DD
  expirationDate?: string;    // Optional, ISO date string
  notes?: string;
  isActive: boolean;
}

// Price List Item - single commodity price within a price list
export interface NewPriceListItem extends AuditFields {
  id: string;
  priceListId: string;
  commodityId: string;
  price: number;              // Single price (direction comes from group)
  unit: WeightUnit;
  currency: Currency;
  notes?: string;
}

// Display type combining commodity with resolved price
export interface CommodityPrice {
  commodityId: string;
  commodityName: string;
  commodityCode: string;
  price: number;
  unit: WeightUnit;
  currency: Currency;
  priceListId: string;
  priceListName: string;
  pricingGroupId: string;
  pricingGroupName: string;
  effectiveDate: string;
  expirationDate?: string;
}

// Pricing group with summary statistics
export interface PricingGroupWithStats extends PricingGroup {
  priceListCount: number;
  commodityCount: number;
  accountCount: number;
}

// Price list with items for display
export interface PriceListWithItems extends PriceList {
  items: NewPriceListItem[];
  pricingGroupName?: string;
  pricingGroupDirection?: PricingDirection;
}

// Type guard for pricing direction
export const isPricingDirection = (value: unknown): value is PricingDirection => {
  return value === 'buy' || value === 'sell';
};

// Helper to get direction label
export const getDirectionLabel = (direction: PricingDirection): string => {
  return direction === 'buy' ? 'Buy' : 'Sell';
};

// Helper to get direction description
export const getDirectionDescription = (direction: PricingDirection): string => {
  return direction === 'buy'
    ? 'Prices paid when purchasing from suppliers'
    : 'Prices charged when selling to customers';
};
