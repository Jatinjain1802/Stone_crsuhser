// src/utils/date.util.js
// ---------------------------------------------------------------
// Date formatting utilities using date-fns library.
//
// WHY date-fns?
// JavaScript's built-in Date object is powerful but has quirky APIs.
// date-fns provides clean, functional utilities for date operations.
// ---------------------------------------------------------------

import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

/**
 * Format date for display
 * @example formatDate("2025-05-13") → "13 May 2025"
 */
export const formatDate = (date) => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(d, 'dd MMM yyyy')
  } catch {
    return '-'
  }
}

/**
 * Format date with time
 * @example formatDateTime("2025-05-13T10:30:00") → "13 May 2025, 10:30 AM"
 */
export const formatDateTime = (date) => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(d, 'dd MMM yyyy, hh:mm a')
  } catch {
    return '-'
  }
}

/**
 * Format date for input[type="date"] (YYYY-MM-DD)
 * @example toInputDate(new Date()) → "2025-05-13"
 */
export const toInputDate = (date) => {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(d, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

/**
 * Format time only
 * @example formatTime("2025-05-13T10:30:00") → "10:30 AM"
 */
export const formatTime = (date) => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(d, 'hh:mm a')
  } catch {
    return '-'
  }
}

/**
 * Relative time — "2 hours ago", "3 days ago"
 */
export const timeAgo = (date) => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date)
    if (isToday(d)) return `Today, ${format(d, 'hh:mm a')}`
    if (isYesterday(d)) return `Yesterday, ${format(d, 'hh:mm a')}`
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '-'
  }
}

/**
 * Get start and end of today for filters
 */
export const getTodayRange = () => {
  const today = new Date()
  const start = new Date(today.setHours(0, 0, 0, 0))
  const end = new Date(today.setHours(23, 59, 59, 999))
  return { fromDate: start.toISOString(), toDate: end.toISOString() }
}

/**
 * Get current financial year string: "2025-26"
 */
export const getCurrentFY = () => {
  const now = new Date()
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${year}-${String(year + 1).slice(2)}`
}
