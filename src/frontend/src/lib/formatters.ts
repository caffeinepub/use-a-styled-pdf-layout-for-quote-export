// Utility functions for formatting numbers and currency

/**
 * Format a number with thousand separators and two decimal places
 * @param value - The number to format
 * @returns Formatted string with thousand separators and 2 decimal places
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number as currency with "Kshs" prefix
 * @param value - The number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return `Kshs ${formatNumber(value)}`;
}

/**
 * Format a percentage with one decimal place
 * @param value - The percentage value to format
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
