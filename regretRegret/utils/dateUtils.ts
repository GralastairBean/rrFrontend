/**
 * Utility functions for handling UTC dates and timezone conversions
 */

/**
 * Convert a UTC date string to a local date object
 * @param utcDateString - ISO string from backend (UTC)
 * @returns Local date object
 */
export const utcToLocalDate = (utcDateString: string): Date => {
  return new Date(utcDateString);
};

/**
 * Get the start of a day in local timezone
 * @param date - Date object
 * @returns Date object set to start of day in local timezone
 */
export const getStartOfDay = (date: Date): Date => {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  return localDate;
};

/**
 * Get the end of a day in local timezone
 * @param date - Date object
 * @returns Date object set to end of day in local timezone
 */
export const getEndOfDay = (date: Date): Date => {
  const localDate = new Date(date);
  localDate.setHours(23, 59, 59, 999);
  return localDate;
};

/**
 * Convert a local date to UTC ISO string for API requests
 * @param localDate - Local date object
 * @returns UTC ISO string
 */
export const localToUtcISO = (localDate: Date): string => {
  return localDate.toISOString();
};

/**
 * Check if two dates represent the same day in local timezone
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

/**
 * Get a date X days ago from today in local timezone
 * @param days - Number of days to subtract
 * @returns Date object
 */
export const getDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getStartOfDay(date);
};

/**
 * Format a date for display in the history page
 * @param date - Date object
 * @returns Formatted date string
 */
export const formatHistoryDate = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};

/**
 * Check if a date is a weekend
 * @param date - Date object
 * @returns True if weekend
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}; 