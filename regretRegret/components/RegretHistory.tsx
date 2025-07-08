import { StyleSheet, Text, View, ScrollView, TextStyle, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { useState, useEffect, Fragment } from 'react';
import { getRegretIndexColor } from '../App';
import { useTheme, colors } from '../utils/ThemeContext';
import { checklistService } from '../api/services/checklistService';
import { Checklist } from '../api/types';
import { LineChart } from 'react-native-chart-kit';
import { 
  utcToLocalDate, 
  getStartOfDay, 
  getEndOfDay, 
  localToUtcISO, 
  isSameDay, 
  getDaysAgo, 
  formatHistoryDate, 
  isWeekend 
} from '../utils/dateUtils';

interface DayHistory {
  date: Date;
  regretIndex: number;
  score: string | null;
}

interface RegretHistoryProps {
  currentRegretIndex: number;
}

type TimePeriod = 7 | 14 | 30;

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
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(7);
  const { theme } = useTheme();
  const themeColors = colors[theme];

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get today's date in local timezone
        const today = getStartOfDay(new Date());
        
        // Get date X days ago based on selected period
        const startDate = getDaysAgo(selectedPeriod);
        
        // Convert to UTC ISO strings for API request
        const startDateStr = localToUtcISO(startDate);
        const endDateStr = localToUtcISO(getEndOfDay(today));
        
        // Fetch checklists for the date range
        const checklists = await checklistService.getChecklists({
          created_at_after: startDateStr,
          created_at_before: endDateStr
        });
        
        // Create array of days with valid data from checklists
        const checklistMap = new Map<number, DayHistory>();
        checklists.forEach(checklist => {
          // Convert UTC date from backend to local date
          const checklistLocalDate = utcToLocalDate(checklist.created_at);
          const checklistDateStart = getStartOfDay(checklistLocalDate);
          // Skip if it's today
          if (isSameDay(checklistDateStart, today)) {
            return;
          }
          // Use the score directly from the checklist
          const scoreNum = parseFloat(checklist.score);
          if (!isNaN(scoreNum)) {
            checklistMap.set(checklistDateStart.getTime(), {
              date: checklistDateStart,
              regretIndex: Math.round(scoreNum * 100), // Convert decimal score to percentage
              score: checklist.score
            });
          }
        });

        // Build days array for each day in the period (excluding today)
        const days: DayHistory[] = [];
        for (let i = selectedPeriod; i >= 1; i--) {
          const day = getStartOfDay(getDaysAgo(i));
          const key = day.getTime();
          if (checklistMap.has(key)) {
            days.push(checklistMap.get(key)!);
          } else {
            days.push({
              date: day,
              regretIndex: 100,
              score: '1.0',
            });
          }
        }
        // Sort days by date (most recent first)
        days.sort((a, b) => b.date.getTime() - a.date.getTime());
        setHistoryData(days);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history data');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [selectedPeriod]); // Add selectedPeriod as a dependency

  // Calculate average
  const numDays = historyData.length;
  const averageIndex = calculateAverageIndex(historyData, numDays);

  const renderChart = () => {
    if (historyData.length === 0) return null;

    // Reverse the data to show oldest to newest (left to right)
    const chartData = [...historyData].reverse();
    
    // Prepare data for the chart
    const data = {
      labels: chartData.map((day, index) => {
        // Show fewer labels to prevent overcrowding
        if (index % Math.ceil(chartData.length / 5) === 0) {
          return day.date.getDate().toString();
        }
        return '';
      }),
      datasets: [{
        data: chartData.map(day => day.regretIndex),
        color: () => theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',  // Semi-transparent gray based on theme
        strokeWidth: 2,
        withDots: true,
        // Define colors for individual dots
        dotColor: (dataPoint: number) => getRegretIndexColor(dataPoint)
      }]
    };

    const chartConfig = {
      backgroundColor: themeColors.background,
      backgroundGradientFrom: themeColors.background,
      backgroundGradientTo: themeColors.background,
      decimalPlaces: 0,
      color: (opacity = 1) => themeColors.text,
      labelColor: (opacity = 1) => themeColors.text,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: "4",
        strokeWidth: "2"
      },
      // Set fixed Y-axis range
      min: 0,
      max: 100,
      // Customize Y-axis ticks
      count: 5, // This will show ticks at 0, 25, 50, 75, 100
      formatYLabel: (value: string) => `${value}`,
      // Force Y-axis to use exact min/max values
      segment: 4
    };

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={Dimensions.get("window").width}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
          withVerticalLines={false}
          withHorizontalLines={true}
          withDots={true}
          withShadow={false}
          yAxisLabel=""
          yAxisSuffix="%"
          getDotColor={(dataPoint: number) => getRegretIndexColor(dataPoint)}
          fromZero={true}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.primary }]}>Regret History</Text>
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
          <Text style={[styles.title, { color: themeColors.primary }]}>Regret History</Text>
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
        <Text style={[styles.title, { color: themeColors.primary }]}>Regret History</Text>
        
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 7 && styles.selectedPeriodButton,
              { backgroundColor: selectedPeriod === 7 ? themeColors.primary : themeColors.surface }
            ]}
            onPress={() => setSelectedPeriod(7)}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === 7 ? themeColors.buttonText : themeColors.text }
            ]}>7 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 14 && styles.selectedPeriodButton,
              { backgroundColor: selectedPeriod === 14 ? themeColors.primary : themeColors.surface }
            ]}
            onPress={() => setSelectedPeriod(14)}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === 14 ? themeColors.buttonText : themeColors.text }
            ]}>14 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 30 && styles.selectedPeriodButton,
              { backgroundColor: selectedPeriod === 30 ? themeColors.primary : themeColors.surface }
            ]}
            onPress={() => setSelectedPeriod(30)}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === 30 ? themeColors.buttonText : themeColors.text }
            ]}>30 Days</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          {numDays > 0 && (
            <View style={styles.statItem}>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: themeColors.text }]}>
                  Average (Last {numDays} Day{numDays !== 1 ? 's' : ''}):
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: getRegretIndexColor(averageIndex) }
                ]}>
                  {averageIndex === -1 ? 'N/A' : `${averageIndex}%`}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {historyData.length === 0 
            ? 'No history available yet' 
            : `Last ${numDays} day${numDays !== 1 ? 's' : ''} of history`
          }
        </Text>
      </View>

      {historyData.length > 0 && (
        <Fragment>
          {renderChart()}
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
                    {formatHistoryDate(day.date)}
                  </Text>
                  <Text style={[styles.indexText, { color }, style]}>
                    {text}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </Fragment>
      )}

      {historyData.length === 0 && (
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
    justifyContent: 'flex-start',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
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
  chartContainer: {
    paddingHorizontal: 0,
    marginBottom: 20,
    alignItems: 'center'
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedPeriodButton: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 