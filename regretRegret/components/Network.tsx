import { StyleSheet, Text, View, Image, TextStyle } from 'react-native';
import { authService } from '../api/services/authService';
import { useState, useEffect } from 'react';
import { getRegretIndexColor } from '../App';

interface NetworkProps {
  currentRegretIndex: number;
}

interface Subscriber {
  username: string;
  regretIndex: number;
}

const formatRegretIndex = (index: number): { text: string; color: string; style: TextStyle } => {
  if (index === -1) return { text: 'SLACKER', color: '#f44336', style: { fontWeight: 'bold' } };
  return { text: `${index}%`, color: getRegretIndexColor(index), style: {} };
};

const generateRandomSubscribers = (): Subscriber[] => {
  const randomUsernames = [
    'FrogLover42',
    'RegretMaster',
    'NoRegrets2024',
    'CroakDaily',
    'TadpoleThinker'
  ];

  return randomUsernames.map(username => ({
    username,
    regretIndex: Math.random() < 0.2 ? -1 : Math.floor(Math.random() * 100) // 20% chance of being a slacker
  }));
};

export default function Network({ currentRegretIndex }: NetworkProps) {
  const [username, setUsername] = useState<string>('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
    const loadUsername = async () => {
      const storedUsername = await authService.getStoredUsername();
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    loadUsername();
    setSubscribers(generateRandomSubscribers());
  }, []);

  const { text, color, style } = formatRegretIndex(currentRegretIndex);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network</Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.usernameContainer}>
          <Image 
            source={require('../assets/user_1.png')}
            style={styles.userIcon}
            resizeMode="contain"
          />
          <Text style={styles.username}>{username}</Text>
          <Text style={[styles.regretIndex, { color }, style]}>
            {text}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Daily Croak Subscribers</Text>
      
      <View style={styles.subscribersList}>
        {subscribers.map((subscriber, index) => {
          const { text, color, style } = formatRegretIndex(subscriber.regretIndex);
          return (
            <View key={index} style={styles.subscriberItem}>
              <View style={styles.subscriberInfo}>
                <Image 
                  source={require('../assets/user_1.png')}
                  style={styles.subscriberIcon}
                  resizeMode="contain"
                />
                <Text style={styles.subscriberUsername}>{subscriber.username}</Text>
              </View>
              <Text style={[styles.subscriberRegretIndex, { color }, style]}>
                {text}
              </Text>
            </View>
          );
        })}
      </View>
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
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
    textAlign: 'center',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    tintColor: '#4CAF50',
  },
  username: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  regretIndex: {
    fontSize: 18,
    marginLeft: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  subscribersList: {
    paddingHorizontal: 20,
  },
  subscriberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  subscriberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriberIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#4CAF50',
  },
  subscriberUsername: {
    fontSize: 16,
    color: '#fff',
  },
  subscriberRegretIndex: {
    fontSize: 16,
  },
}); 