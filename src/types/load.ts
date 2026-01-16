// Load (Shipment) types

import type { LoadStatus, WeightUnit, Currency, AuditFields } from './common';

export type FreightTerms = 'prepaid' | 'collect' | 'third_party';

export type LoadDocumentType = 'bol' | 'scale_ticket' | 'pod' | 'other';

export interface LoadDocument {
  id: string;
  type: LoadDocumentType;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Load extends AuditFields {
  id: string;
  loadNumber: string;
  status: LoadStatus;
  brokeredOrderId?: string;
  brokeredOrderNumber?: string;  // Denormalized
  purchaseOrderId?: string;
  salesOrderId?: string;
  carrierId: string;
  carrierName?: string;          // Denormalized
  originPartyId: string;
  originPartyName?: string;      // Denormalized (supplier)
  destinationPartyId: string;
  destinationPartyName?: string; // Denormalized (customer)
  commodityId: string;
  commodityName?: string;         // Denormalized
  scheduledPickupDate: string;
  actualPickupDate?: string;
  scheduledDeliveryDate: string;
  actualDeliveryDate?: string;
  estimatedWeight: number;
  actualWeight?: number;
  unit: WeightUnit;
  freightCost?: number;
  freightCurrency?: Currency;
  freightTerms?: FreightTerms;
  bolNumber?: string;
  documents: LoadDocument[];
  notes?: string;
}

// Calculate weight variance
export const calculateWeightVariance = (load: Load): number | null => {
  if (!load.actualWeight) return null;
  return load.actualWeight - load.estimatedWeight;
};

// Calculate weight variance percentage
export const calculateWeightVariancePercent = (load: Load): number | null => {
  if (!load.actualWeight || load.estimatedWeight === 0) return null;
  return Math.round(((load.actualWeight - load.estimatedWeight) / load.estimatedWeight) * 10000) / 100;
};
