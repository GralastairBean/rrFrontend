/**
 * Get current local datetime with timezone in ISO format
 * Returns format: YYYY-MM-DDTHH:mm:ss±HH:mm
 * Example: 2025-06-19T01:00:00+08:00
 */
export const getLocalDateTimeWithTimezone = (): string => {
  const now = new Date();
  
  // Get timezone offset in minutes
  const timezoneOffset = now.getTimezoneOffset();
  
  // Convert offset to hours and minutes
  const hours = Math.abs(Math.floor(timezoneOffset / 60));
  const minutes = Math.abs(timezoneOffset % 60);
  
  // Format offset string
  const offsetString = (timezoneOffset <= 0 ? '+' : '-') + 
    hours.toString().padStart(2, '0') + ':' + 
    minutes.toString().padStart(2, '0');
  
  // Get local datetime string (YYYY-MM-DDTHH:mm:ss)
  const localDateString = now.getFullYear() + '-' +
    (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
    now.getDate().toString().padStart(2, '0') + 'T' +
    now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0');
  
  return localDateString + offsetString;
};

/**
 * Get current timezone information for display
 * Returns format: UTC±HH:mm (Timezone Name)
 * Example: UTC+08:00 (Asia/Singapore)
 */
export const getTimezoneInfo = (): string => {
  const now = new Date();
  
  // Get timezone offset in minutes
  const timezoneOffset = now.getTimezoneOffset();
  
  // Convert offset to hours and minutes
  const hours = Math.abs(Math.floor(timezoneOffset / 60));
  const minutes = Math.abs(timezoneOffset % 60);
  
  // Format offset string
  const offsetString = (timezoneOffset <= 0 ? '+' : '-') + 
    hours.toString().padStart(2, '0') + ':' + 
    minutes.toString().padStart(2, '0');
  
  // Try to get timezone name (this may not work in all environments)
  let timezoneName = '';
  try {
    timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    timezoneName = 'Unknown';
  }
  
  return `UTC${offsetString} (${timezoneName})`;
};

/**
 * Get current local date in YYYY-MM-DD format
 */
export const getLocalDate = (): string => {
  const now = new Date();
  return now.getFullYear() + '-' +
    (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
    now.getDate().toString().padStart(2, '0');
}; 