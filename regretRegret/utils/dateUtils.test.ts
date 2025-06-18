/**
 * Simple test file to verify date utility functions work correctly
 * This can be run manually to test the UTC date handling
 */

import { 
  utcToLocalDate, 
  getStartOfDay, 
  getEndOfDay, 
  localToUtcISO, 
  isSameDay, 
  getDaysAgo, 
  formatHistoryDate, 
  isWeekend 
} from './dateUtils';

// Test function to verify UTC date handling
export const testDateUtils = () => {
  console.log('🧪 Testing Date Utility Functions...\n');

  // Test 1: UTC to Local conversion
  const utcDateString = '2024-01-15T10:30:00Z';
  const localDate = utcToLocalDate(utcDateString);
  console.log('Test 1 - UTC to Local:');
  console.log(`  UTC: ${utcDateString}`);
  console.log(`  Local: ${localDate.toISOString()}`);
  console.log(`  Local String: ${localDate.toString()}\n`);

  // Test 2: Start and End of Day
  const testDate = new Date('2024-01-15T14:30:00');
  const startOfDay = getStartOfDay(testDate);
  const endOfDay = getEndOfDay(testDate);
  console.log('Test 2 - Start/End of Day:');
  console.log(`  Original: ${testDate.toISOString()}`);
  console.log(`  Start: ${startOfDay.toISOString()}`);
  console.log(`  End: ${endOfDay.toISOString()}\n`);

  // Test 3: Local to UTC ISO
  const localDate2 = new Date('2024-01-15T14:30:00');
  const utcISO = localToUtcISO(localDate2);
  console.log('Test 3 - Local to UTC ISO:');
  console.log(`  Local: ${localDate2.toISOString()}`);
  console.log(`  UTC ISO: ${utcISO}\n`);

  // Test 4: Same Day Check
  const date1 = new Date('2024-01-15T10:00:00');
  const date2 = new Date('2024-01-15T22:00:00');
  const date3 = new Date('2024-01-16T10:00:00');
  console.log('Test 4 - Same Day Check:');
  console.log(`  ${date1.toISOString()} vs ${date2.toISOString()}: ${isSameDay(date1, date2)}`);
  console.log(`  ${date1.toISOString()} vs ${date3.toISOString()}: ${isSameDay(date1, date3)}\n`);

  // Test 5: Days Ago
  const daysAgo = getDaysAgo(7);
  console.log('Test 5 - Days Ago:');
  console.log(`  7 days ago: ${daysAgo.toISOString()}\n`);

  // Test 6: Format History Date
  const historyDate = new Date('2024-01-15T10:30:00');
  const formatted = formatHistoryDate(historyDate);
  console.log('Test 6 - Format History Date:');
  console.log(`  ${historyDate.toISOString()} -> ${formatted}\n`);

  // Test 7: Weekend Check
  const weekendDate = new Date('2024-01-13T10:30:00'); // Saturday
  const weekdayDate = new Date('2024-01-15T10:30:00'); // Monday
  console.log('Test 7 - Weekend Check:');
  console.log(`  ${weekendDate.toISOString()} (${weekendDate.toDateString()}): ${isWeekend(weekendDate)}`);
  console.log(`  ${weekdayDate.toISOString()} (${weekdayDate.toDateString()}): ${isWeekend(weekdayDate)}\n`);

  console.log('✅ Date utility tests completed!');
};

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).testDateUtils = testDateUtils;
} 