import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme, colors } from '../utils/ThemeContext';
import { getRegretIndexColor } from '../App';
import { 
  getStartOfDay, 
  getDaysAgo, 
  localToUtcISO, 
  utcToLocalDate,
  isSameDay,
  getEndOfDay
} from '../utils/dateUtils';
import { checklistService } from '../api/services/checklistService';
import { useState, useEffect } from 'react';

interface DayHistory {
  date: Date;
  regretIndex: number;
  score: string | null;
}

interface GridViewProps {
  visible: boolean;
  onClose: () => void;
  historyData: DayHistory[];
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default function GridView({ visible, onClose, historyData }: GridViewProps) {
  const { theme } = useTheme();
  const themeColors = colors[theme];
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  // Calculate box size to fit both width and height constraints
  const availableWidth = screenWidth - 40; // 40px total padding
  const availableHeight = screenHeight - 200; // 200px for header, padding, and buffer
  
  const maxWidthBoxSize = availableWidth / 12; // 12 months
  const maxHeightBoxSize = availableHeight / 31; // 31 days
  
  const boxSize = Math.min(maxWidthBoxSize, maxHeightBoxSize);
  const [fullYearData, setFullYearData] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(false);

  // Create a map of dates to regret indices for quick lookup
  const historyMap = new Map<number, number>();
  historyData.forEach(day => {
    const key = day.date.getTime();
    historyMap.set(key, day.regretIndex);
  });

  // Fetch full year data when grid opens
  useEffect(() => {
    if (visible) {
      fetchFullYearData();
    }
  }, [visible]);

  const fetchFullYearData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const currentYear = today.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31);
      
      const startDateStr = localToUtcISO(getStartOfDay(startOfYear));
      const endDateStr = localToUtcISO(getEndOfDay(endOfYear));
      
      const checklists = await checklistService.getChecklists({
        created_at_after: startDateStr,
        created_at_before: endDateStr
      });
      
      const yearMap = new Map<number, number>();
      checklists.forEach(checklist => {
        const checklistLocalDate = utcToLocalDate(checklist.created_at);
        const checklistDateStart = getStartOfDay(checklistLocalDate);
        const key = checklistDateStart.getTime();
        const scoreNum = parseFloat(checklist.score);
        if (!isNaN(scoreNum)) {
          yearMap.set(key, Math.round(scoreNum * 100));
        }
      });
      
      setFullYearData(yearMap);
    } catch (error) {
      console.error('Failed to fetch full year data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate grid data for the current year
  const generateGridData = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const gridData: { month: string; days: Array<{ day: number; regretIndex: number; date: Date }> }[] = [];

    for (let month = 0; month < 12; month++) {
      const monthName = monthNames[month];
      const daysInThisMonth = month === 1 && currentYear % 4 === 0 ? 29 : daysInMonth[month];
      const days: Array<{ day: number; regretIndex: number; date: Date }> = [];

      for (let day = 1; day <= daysInThisMonth; day++) {
        const date = new Date(currentYear, month, day);
        const key = getStartOfDay(date).getTime();
        
        // Check if we have full year data for this date
        let regretIndex = 100; // Default to 100% if no data
        
        if (fullYearData.has(key)) {
          regretIndex = fullYearData.get(key)!;
        } else if (date <= today) {
          // If it's a past date with no data, it's 100%
          regretIndex = 100;
        } else {
          // Future dates get no color
          regretIndex = -1;
        }

        days.push({ day, regretIndex, date });
      }

      gridData.push({ month: monthName, days });
    }

    return gridData;
  };

  const gridData = generateGridData();

  const renderDayBox = (dayData: { day: number; regretIndex: number; date: Date }) => {
    const { day, regretIndex, date } = dayData;
    const today = new Date();
    const isToday = isSameDay(date, today);
    const isFuture = date > today;
    
    let backgroundColor = 'transparent';
    let borderColor = themeColors.border;
    let borderWidth = 0.5;

    if (isToday) {
      // Today's date is empty/transparent - user hasn't completed it yet
      backgroundColor = 'transparent';
      borderColor = themeColors.border;
      borderWidth = 0.5;
    } else if (isFuture) {
      backgroundColor = 'transparent';
      borderColor = themeColors.border;
      borderWidth = 0.5;
    } else if (regretIndex === -1) {
      backgroundColor = '#f44336'; // Red for SLACKER
    } else {
      backgroundColor = getRegretIndexColor(regretIndex);
    }

    return (
      <View
        key={day}
        style={[
          styles.dayBox,
          {
            width: boxSize,
            height: boxSize,
            backgroundColor,
            borderColor,
            borderWidth,
          }
        ]}
      >

      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={[styles.title, { color: themeColors.primary }]}>{new Date().getFullYear()}</Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: 'transparent' }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: themeColors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading grid data...</Text>
          </View>
        ) : (
          <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.gridLayout}>
                              <View style={styles.dayLabelsColumn}>
                  <View style={[styles.dayLabelHeader, { height: boxSize }]} />
                  {Array.from({ length: 31 }, (_, i) => (
                    <View key={i} style={[styles.dayLabelContainer, { height: boxSize }]}>
                      <Text style={[styles.dayLabel, { color: themeColors.textSecondary }]}>
                        {i + 1}
                      </Text>
                    </View>
                  ))}
                </View>
              <View style={styles.monthsContainer}>
                {gridData.map((monthData, monthIndex) => (
                  <View key={monthIndex} style={styles.monthColumn}>
                    <Text style={[styles.monthLabel, { color: themeColors.text }]}>
                      {monthData.month.charAt(0)}
                    </Text>
                    <View style={styles.daysColumn}>
                      {monthData.days.map((dayData, dayIndex) => (
                        <View key={dayIndex} style={styles.dayContainer}>
                          {renderDayBox(dayData)}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    width: 40, // Further reduced for better left positioning
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closeButtonText: {
    fontWeight: '300',
    fontSize: 18,
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gridLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dayLabelsColumn: {
    marginRight: 4,
    alignItems: 'flex-end',
  },
  dayLabelHeader: {
    marginBottom: 4,
  },
  dayLabelContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  monthsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 1,
  },
  monthColumn: {
    marginRight: 1,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  daysColumn: {
    flexDirection: 'column',
    gap: 0,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  dayText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 20,
  },
}); 