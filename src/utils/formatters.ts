/**
 * Shared formatting utilities for consistent display across the application
 */

/**
 * Format a number as USD currency
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 */
export const formatCurrency = (value?: number | null, decimals: number = 2): string => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a number as whole dollar amount (no cents)
 * @param value - The number to format
 */
export const formatCurrencyWhole = (value?: number | null): string => {
  return formatCurrency(value, 0)
}

/**
 * Format a date string as "Mon DD, YYYY"
 * @param date - ISO date string or Date object
 */
export const formatDate = (date?: string | Date | null): string => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date string as "Mon DD, YYYY HH:MM AM/PM"
 * @param date - ISO date string or Date object
 */
export const formatDateTime = (date?: string | Date | null): string => {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Format a number with locale-specific formatting
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 */
export const formatNumber = (value?: number | null, decimals: number = 0): string => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a percentage value
 * @param value - The percentage value (e.g., 50 for 50%)
 * @param decimals - Number of decimal places (default: 1)
 */
export const formatPercent = (value?: number | null, decimals: number = 1): string => {
  if (value === undefined || value === null) return '-'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a weight value with unit
 * @param value - The weight value
 * @param unit - The unit (e.g., 'LB', 'KG', 'MT')
 */
export const formatWeight = (value?: number | null, unit: string = 'LB'): string => {
  if (value === undefined || value === null) return '-'
  return `${formatNumber(value, 0)} ${unit}`
}
