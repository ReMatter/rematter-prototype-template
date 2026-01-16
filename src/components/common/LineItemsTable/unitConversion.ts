import { WEIGHT_UNITS, BASE_WEIGHT_UNIT } from './types'

/**
 * Convert a value from one unit to another.
 * Handles weight unit conversions (LB, KG, TON).
 * Non-weight units pass through unchanged.
 */
export const convertUnit = (value: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === toUnit) return value

  // Only convert weight units
  if (!WEIGHT_UNITS.includes(fromUnit as any) || !WEIGHT_UNITS.includes(toUnit as any)) {
    return value
  }

  // Convert to base unit (LB) first
  let inLb = value
  if (fromUnit === 'KG') inLb = value * 2.20462
  if (fromUnit === 'TON') inLb = value * 2000

  // Convert from LB to target
  if (toUnit === 'LB') return inLb
  if (toUnit === 'KG') return inLb / 2.20462
  if (toUnit === 'TON') return inLb / 2000

  return value
}

/**
 * Get the weighing unit based on toggle state and pricing unit.
 * When toggle is OFF: use base unit (LB) for weight items
 * When toggle is ON: use pricing unit directly
 */
export const getWeighingUnit = (pricingUnit: string, usePricingUnit: boolean): string => {
  if (usePricingUnit) return pricingUnit

  // Use base unit for weighing if it's a weight unit
  if (WEIGHT_UNITS.includes(pricingUnit as any)) {
    return BASE_WEIGHT_UNIT
  }

  // Non-weight units (EA) stay the same
  return pricingUnit
}

/**
 * Calculate the total price for a line item.
 * Converts quantity from weighing unit to pricing unit before multiplying.
 */
export const calculateLineItemTotal = (
  quantity: number,
  pricePerUnit: number,
  pricingUnit: string,
  usePricingUnitForWeighing: boolean
): number => {
  const weighingUnit = getWeighingUnit(pricingUnit, usePricingUnitForWeighing)
  const quantityInPricingUnit = convertUnit(quantity, weighingUnit, pricingUnit)
  return quantityInPricingUnit * pricePerUnit
}

/**
 * Check if a unit is a weight unit
 */
export const isWeightUnit = (unit: string): boolean => {
  return WEIGHT_UNITS.includes(unit as any)
}

/**
 * Check if a unit is a quantity unit
 */
export const isQuantityUnit = (unit: string): boolean => {
  return unit === 'EA'
}
