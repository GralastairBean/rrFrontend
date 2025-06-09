import { StyleSheet, Text, View, ScrollView, TextStyle } from 'react-native';
import { useState, useEffect } from 'react';
import { getRegretIndexColor } from '../App';
import { useTheme, colors } from '../utils/ThemeContext';

interface DayHistory {
  date: Date;
  regretIndex: number;
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

export default function RegretHistory({ currentRegretIndex }: RegretHistoryProps) {
  const [historyData, setHistoryData] = useState<DayHistory[]>([]);
  const { theme } = useTheme();
  const themeColors = colors[theme];

  useEffect(() => {
    // For now, generate mock data
    const generateMockData = () => {
      const data: DayHistory[] = [];
      const today = new Date();
      
      // Add today with current regret index from props
      data.push({
        date: today,
        regretIndex: currentRegretIndex
      });

      // Add last 29 days with random indices (30 days total including today)
      for (let i = 1; i <= 29; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        data.push({
          date,
          regretIndex: Math.floor(Math.random() * 100)
        });
      }

      setHistoryData(data);
    };

    generateMockData();
  }, [currentRegretIndex]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.primary }]}>Regret Index History</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Last 30 Days</Text>
      </View>

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
}); 