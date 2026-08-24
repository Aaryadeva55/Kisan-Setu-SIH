import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

/**
 * Merge class names safely with Tailwind
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format Indian Currency (₹)
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format Quantity in kg, Quintals or Tonnes
 */
export function formatQuantity(kg) {
  if (!kg && kg !== 0) return '-';
  if (kg >= 1000) {
    return `${(kg / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} tonnes (${kg.toLocaleString('en-IN')} kg)`;
  }
  if (kg >= 100) {
    return `${(kg / 100).toLocaleString('en-IN', { maximumFractionDigits: 1 })} quintals (${kg} kg)`;
  }
  return `${kg.toLocaleString('en-IN')} kg`;
}

/**
 * Date formatting wrapper
 */
export function formatDate(dateString, pattern = 'dd MMM yyyy') {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, pattern);
  } catch {
    return dateString;
  }
}

/**
 * Relative time wrapper ("2 hours ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}
