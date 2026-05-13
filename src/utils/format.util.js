// src/utils/format.util.js
// ---------------------------------------------------------------
// Utility functions for formatting data for display.
// These are pure functions — they take input, return output, no side effects.
// ---------------------------------------------------------------

/**
 * Format a number as Indian Rupees currency
 * @example formatCurrency(125000) → "₹1,25,000"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0'
  
  // Intl.NumberFormat is a browser API for locale-aware formatting
  // 'en-IN' = English, India locale (uses Indian numbering: 1,00,000)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a number with Indian comma system (no currency symbol)
 * @example formatNumber(125000) → "1,25,000"
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return new Intl.NumberFormat('en-IN').format(num)
}

/**
 * Format weight in tons
 * @example formatWeight(1.5) → "1.5 ton"
 */
export const formatWeight = (tons) => {
  if (!tons && tons !== 0) return '-'
  return `${Number(tons).toFixed(2)} ton`
}

/**
 * Get badge variant class based on invoice status
 */
export const getStatusBadge = (status) => {
  const map = {
    paid:     'badge-success',
    partial:  'badge-warning',
    unpaid:   'badge-danger',
    active:   'badge-success',
    inactive: 'badge-neutral',
    in:       'badge-info',
    out:      'badge-warning',
  }
  return map[status] || 'badge-neutral'
}

/**
 * Get display label for status
 */
export const getStatusLabel = (status) => {
  const map = {
    paid:    'Paid',
    partial: 'Partial',
    unpaid:  'Unpaid',
    in:      'Incoming',
    out:     'Outgoing',
    admin:       'Admin',
    manager:     'Manager',
    accountant:  'Accountant',
    gate:        'Gate',
    diesel:      'Diesel',
    labour:      'Labour',
    maintenance: 'Maintenance',
    electricity: 'Electricity',
    other:       'Other',
    regular:     'Regular',
    contractor:  'Contractor',
    onetime:     'One-time',
    raw:      'Raw Material',
    finished: 'Finished Goods',
  }
  return map[status] || status
}

/**
 * Truncate long strings
 * @example truncate("Hello World", 8) → "Hello Wo..."
 */
export const truncate = (str, length = 30) => {
  if (!str) return '-'
  return str.length > length ? str.substring(0, length) + '...' : str
}
