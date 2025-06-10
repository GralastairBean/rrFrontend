import { StyleSheet, Text, View, ScrollView, TextStyle, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { getRegretIndexColor } from '../App';
import { useTheme, colors } from '../utils/ThemeContext';
import { checklistService } from '../api/services/checklistService';
import { Checklist } from '../api/types';

interface DayHistory {
  date: Date;
  regretIndex: number;
  score: string | null;
}

interface RegretHistoryProps {
  currentRegretIndex: number;
}

const formatDate = (date: Date) => {
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

const formatRegretIndex = (index: number): { text: string; color: string; style: TextStyle } => {
  if (index === -1) return { text: 'SLACKER', color: '#f44336', style: { fontWeight: 'bold' } };
  return { text: `${index}%`, color: getRegretIndexColor(index), style: {} };
};

const calculateAverageIndex = (data: DayHistory[], days: number) => {
  // Need at least one previous day (excluding today)
  if (data.length <= 1) return -1;
  
  // Get previous days (skip today)
  const previousDays = data.slice(1, days + 1);
  if (previousDays.length === 0) return -1;
  
  const sum = previousDays.reduce((acc, curr) => acc + curr.regretIndex, 0);
  return Math.round(sum / previousDays.length);
};

export default function RegretHistory({ currentRegretIndex }: RegretHistoryProps) {
  const [historyData, setHistoryData] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const themeColors = colors[theme];

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get today's date
        const today = new Date();
        
        // Get date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 29);  // -29 because we want today + 29 previous days = 30 total
        
        // Format dates for API
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        // Fetch checklists for the date range
        const checklists = await checklistService.getChecklists({
          created_at_after: startDate,
          created_at_before: endDate
        });
        
        // Create array of days with valid data
        const days: DayHistory[] = [];
        
        // Add today with current regret index if it's valid
        if (currentRegretIndex !== -1) {
          days.push({
            date: today,
            regretIndex: currentRegretIndex,
            score: null  // Today's score might not be calculated yet
          });
        }
        
        // Add days with valid data from checklists
        checklists.forEach(checklist => {
          const checklistDate = new Date(checklist.created_at);
          checklistDate.setHours(0, 0, 0, 0);  // Reset time part
          
          // Skip if it's today (we already added today's data)
          if (checklistDate.toDateString() === today.toDateString()) {
            return;
          }
          
          const scoreNum = parseFloat(checklist.score);
          if (!isNaN(scoreNum)) {
            days.push({
              date: checklistDate,
              regretIndex: Math.round(scoreNum),
              score: checklist.score
            });
          }
        });
        
        // Sort days by date (most recent first)
        days.sort((a, b) => b.date.getTime() - a.date.getTime());
        
        // Take only the first 30 days
        setHistoryData(days.slice(0, 30));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history data');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [currentRegretIndex]);

  // Calculate averages excluding today
  const numPreviousDays = Math.max(0, historyData.length - 1); // Subtract today
  const previousDaysAverage = calculateAverageIndex(historyData, numPreviousDays);
  const sevenDayAverage = calculateAverageIndex(historyData, Math.min(7, numPreviousDays));

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.primary }]}>Regret Index History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading history...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.primary }]}>Regret Index History</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.primary }]}>Regret Index History</Text>
        
        <View style={styles.statsContainer}>
          {numPreviousDays > 0 && (
            <View style={styles.statItem}>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: themeColors.text }]}>
                  Average (Last {numPreviousDays} Day{numPreviousDays !== 1 ? 's' : ''}):
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: getRegretIndexColor(previousDaysAverage) }
                ]}>
                  {previousDaysAverage === -1 ? 'N/A' : `${previousDaysAverage}%`}
                </Text>
              </View>
            </View>
          )}

          {numPreviousDays >= 2 && (
            <View style={styles.statItem}>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: themeColors.text }]}>
                  7 Day Average:
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: getRegretIndexColor(sevenDayAverage) }
                ]}>
                  {sevenDayAverage === -1 ? 'N/A' : `${sevenDayAverage}%`}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {historyData.length === 0 
            ? 'No history available yet' 
            : historyData.length === 1 
              ? 'Showing today only' 
              : `Showing today + ${numPreviousDays} previous day${numPreviousDays !== 1 ? 's' : ''}`
          }
        </Text>
      </View>

      {historyData.length > 0 ? (
        <ScrollView style={styles.content}>
          {historyData.map((day, index) => {
            const { text, color, style } = formatRegretIndex(day.regretIndex);
            const isWeekendDay = isWeekend(day.date);
            return (
              <View 
                key={index} 
                style={[
                  styles.dayItem, 
                  { 
                    borderBottomColor: themeColors.border,
                    backgroundColor: isWeekendDay 
                      ? theme === 'dark' 
                        ? 'rgba(255, 255, 255, 0.03)' // Slightly lighter in dark mode
                        : 'rgba(0, 0, 0, 0.02)' // Slightly darker in light mode
                      : 'transparent'
                  }
                ]}
              >
                <Text style={[
                  styles.dateText, 
                  { color: themeColors.text },
                  isWeekendDay && styles.weekendText
                ]}>
                  {formatDate(day.date)}
                </Text>
                <Text style={[styles.indexText, { color }, style]}>
                  {text}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            Start completing your daily regrets to build up your history
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    width: '100%',
    marginBottom: 15,
  },
  statItem: {
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 14,
  },
  weekendText: {
    fontWeight: '500',
  },
  indexText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 