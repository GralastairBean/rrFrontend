import { StyleSheet, Text, View, ScrollView, TextStyle } from 'react-native';
import { useState, useEffect } from 'react';
import { getRegretIndexColor } from '../App';

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

const formatRegretIndex = (index: number): { text: string; color: string; style: TextStyle } => {
  if (index === -1) return { text: 'SLACKER', color: '#f44336', style: { fontWeight: 'bold' } };
  return { text: `${index}%`, color: getRegretIndexColor(index), style: {} };
};

export default function RegretHistory({ currentRegretIndex }: RegretHistoryProps) {
  const [historyData, setHistoryData] = useState<DayHistory[]>([]);

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

      // Add last 24 days with random indices (25 days total including today)
      for (let i = 1; i <= 24; i++) {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Regret Index History</Text>
        <Text style={styles.subtitle}>Last 25 Days</Text>
      </View>

      <ScrollView style={styles.content}>
        {historyData.map((day, index) => {
          const { text, color, style } = formatRegretIndex(day.regretIndex);
          return (
            <View key={index} style={styles.dayItem}>
              <Text style={styles.dateText}>{formatDate(day.date)}</Text>
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
    backgroundColor: '#121212',
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
    color: '#4CAF50',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#fff',
  },
  indexText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 