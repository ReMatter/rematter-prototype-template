// Commodity and Price List types

import type { WeightUnit, Currency, AuditFields } from './common';

export type CommodityCategory = 'ferrous' | 'non_ferrous' | 'stainless' | 'aluminum' | 'copper' | 'other';

export interface Commodity extends AuditFields {
  id: string;
  name: string;  // Inventory name (canonical, used throughout system)
  code: string;  // Inventory code (e.g., "HMS1", "CU-BARE", "AL-6061")
  category: CommodityCategory;
  description?: string;
  defaultUnit: WeightUnit;
  isActive: boolean;
  // Default aliases (optional, used when no per-account alias exists)
  defaultBuyAsName?: string;   // Default name when purchasing from suppliers
  defaultBuyAsCode?: string;   // Default code when purchasing from suppliers
  defaultSellAsName?: string;  // Default name when selling to customers
  defaultSellAsCode?: string;  // Default code when selling to customers
}

export interface PriceListItem extends AuditFields {
  id: string;
  commodityId: string;
  buyPrice: number;   // Price we pay to suppliers
  sellPrice: number;  // Price we charge customers
  unit: WeightUnit;
  currency: Currency;
  effectiveDate: string;
  expirationDate?: string;
  notes?: string;
}

// Computed type for display
export interface CommodityWithPrice extends Commodity {
  currentBuyPrice?: number;
  currentSellPrice?: number;
  priceCurrency?: Currency;
  margin?: number;
  marginPercent?: number;
}

