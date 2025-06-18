# UTC Date Handling Update for History Page

## Problem
The history page was not properly handling UTC dates returned from the backend. The data is stored with UTC date and timezone in the backend, but the frontend was not correctly converting these dates to the user's local timezone when displaying historical data.

## Issues Identified
1. **Date Range Calculation**: Using local dates to calculate API date ranges instead of proper UTC conversion
2. **Date Comparison**: Comparing dates using `toDateString()` which doesn't account for timezone differences
3. **Date Parsing**: Not properly converting UTC dates from backend to local timezone for display

## Solution Implemented

### 1. Created Date Utility Functions (`utils/dateUtils.ts`)
New utility functions to handle UTC date conversions:

- `utcToLocalDate(utcDateString)`: Convert UTC date string to local date object
- `getStartOfDay(date)`: Get start of day in local timezone
- `getEndOfDay(date)`: Get end of day in local timezone
- `localToUtcISO(localDate)`: Convert local date to UTC ISO string for API requests
- `isSameDay(date1, date2)`: Check if two dates represent the same day in local timezone
- `getDaysAgo(days)`: Get a date X days ago from today in local timezone
- `formatHistoryDate(date)`: Format date for display in history page
- `isWeekend(date)`: Check if a date is a weekend

### 2. Updated RegretHistory Component (`components/RegretHistory.tsx`)
Key changes made:

```typescript
// Before: Using local dates for API requests
const startDateStr = startDate.toISOString().split('T')[0];
const endDateStr = today.toISOString().split('T')[0];

// After: Using proper UTC conversion
const startDateStr = localToUtcISO(startDate);
const endDateStr = localToUtcISO(getEndOfDay(today));
```

```typescript
// Before: Direct date parsing without timezone consideration
const checklistDate = new Date(checklist.created_at);
checklistDate.setHours(0, 0, 0, 0);

// After: Proper UTC to local conversion
const checklistLocalDate = utcToLocalDate(checklist.created_at);
const checklistDateStart = getStartOfDay(checklistLocalDate);
```

```typescript
// Before: Simple date string comparison
if (checklistDate.toDateString() === today.toDateString()) {
  return;
}

// After: Proper same-day check in local timezone
if (isSameDay(checklistDateStart, today)) {
  return;
}
```

### 3. Imported Utility Functions
Replaced local date formatting functions with imported utilities:
- Removed local `formatDate` and `isWeekend` functions
- Imported and used `formatHistoryDate` and `isWeekend` from `dateUtils`

## Benefits
1. **Correct Timezone Handling**: History data now displays in the user's local timezone
2. **Accurate Date Ranges**: API requests use proper UTC date ranges
3. **Consistent Date Display**: All dates are properly converted and formatted
4. **Maintainable Code**: Centralized date utility functions for reuse

## Testing
Created `utils/dateUtils.test.ts` with comprehensive tests for all date utility functions to ensure proper UTC date handling.

## Files Modified
- `utils/dateUtils.ts` (new file)
- `components/RegretHistory.tsx` (updated)
- `utils/dateUtils.test.ts` (new file - for testing)

## Files Unchanged
- `utils/datetime.ts` - Already properly handles timezone-aware datetime creation
- `hooks/useChecklist.ts` - Already uses timezone-aware datetime functions
- Other components - No changes needed as they don't handle UTC dates from backend

## Usage Example
```typescript
// Fetching history data with proper UTC handling
const today = getStartOfDay(new Date());
const startDate = getDaysAgo(30);
const startDateStr = localToUtcISO(startDate);
const endDateStr = localToUtcISO(getEndOfDay(today));

const checklists = await checklistService.getChecklists({
  created_at_after: startDateStr,
  created_at_before: endDateStr
});

// Converting backend UTC dates to local dates
checklists.forEach(checklist => {
  const checklistLocalDate = utcToLocalDate(checklist.created_at);
  const checklistDateStart = getStartOfDay(checklistLocalDate);
  // ... process data
});
``` 