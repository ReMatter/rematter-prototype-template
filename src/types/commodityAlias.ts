// Commodity Alias types - per-counterparty commodity naming

import type { AuditFields } from './common';

export type CommodityAliasType = 'buy' | 'sell';

export interface CommodityAlias extends AuditFields {
  id: string;
  commodityId: string;           // FK to Commodity
  accountId: string;            // FK to Account (supplier or customer)
  aliasName: string;            // What this counterparty calls the commodity
  aliasCode?: string;           // Optional code they use
  aliasType: CommodityAliasType; // 'buy' for suppliers, 'sell' for customers
  notes?: string;               // Optional notes about this alias
}

// Helper type for creating aliases with resolved names
export interface CommodityAliasWithDetails extends CommodityAlias {
  commodityName: string;         // The inventory (canonical) name
  commodityCode: string;         // The inventory (canonical) code
  accountName: string;          // The account/counterparty name
}

