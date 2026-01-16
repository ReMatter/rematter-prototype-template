// Account types (Customers, Suppliers, Carriers)

import type { Address, AuditFields, AccountType } from './common';

// Location type - supports multiple types per location
export type LocationType =
  | 'shipping'
  | 'billing'
  | 'pickup'
  | 'delivery'
  | 'office'
  | 'warehouse';

// Contact associated with a location
export interface LocationContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;  // e.g., "Yard Manager", "Dispatcher", "Accounts Payable"
  isPrimary: boolean;
}

// Operating hours for a location
export interface OperatingHours {
  monday?: { open: string; close: string } | null;
  tuesday?: { open: string; close: string } | null;
  wednesday?: { open: string; close: string } | null;
  thursday?: { open: string; close: string } | null;
  friday?: { open: string; close: string } | null;
  saturday?: { open: string; close: string } | null;
  sunday?: { open: string; close: string } | null;
}

// Main Location interface
export interface AccountLocation {
  id: string;
  name: string;                    // e.g., "Main Warehouse", "West Coast Facility"
  types: LocationType[];           // Multiple types allowed
  address: Address;
  contacts: LocationContact[];
  operatingHours?: OperatingHours;
  notes?: string;
  isActive: boolean;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

// For "Account Name - Location Name" dropdown pattern
export interface AccountLocationOption {
  value: string;              // Format: "accountId:locationId"
  label: string;              // Format: "Account Name - Location Name"
  accountId: string;
  accountName: string;
  locationId: string;
  locationName: string;
  address: Address;
  locationType: LocationType[];
}

export interface Account extends AuditFields {
  id: string;
  type: AccountType;
  name: string;
  code?: string;  // Short code for quick reference (e.g., "ACME", "GRN-MTL")
  locations: AccountLocation[];
  paymentTerms?: string;  // e.g., "Net 30", "Net 15"
  creditLimit?: number;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  // Pricing group assignments
  buyPricingGroupId?: string;   // For when this account is a supplier (we buy from them)
  sellPricingGroupId?: string;  // For when this account is a customer (we sell to them)
}

// Type guards
export const isCustomer = (account: Account): boolean => account.type === 'customer';
export const isSupplier = (account: Account): boolean => account.type === 'supplier';
export const isCarrier = (account: Account): boolean => account.type === 'carrier';
