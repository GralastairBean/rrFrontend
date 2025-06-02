import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { authService } from './api/services/authService';
import Registration from './components/Registration';
import Checklist from './components/Checklist';
import Settings from './components/Settings';
import { Regret } from './api/types';

type Screen = 'main' | 'settings';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [regrets, setRegrets] = useState<Regret[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const storedUsername = await authService.getStoredUsername();
        if (storedUsername) {
          setUsername(storedUsername);
        }
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationComplete = async () => {
    // Verify authentication after registration
    await checkAuthStatus();
  };

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dateNum = date.getDate();
    const year = date.getFullYear();

    return `${day}, ${month} ${dateNum}, ${year}`;
  };

  const handleRegretsUpdate = (updatedRegrets: Regret[]) => {
    setRegrets(updatedRegrets);
  };

  const calculateRegretIndex = () => {
    if (regrets.length === 0) return 100;
    const uncompletedCount = regrets.filter(r => !r.success).length;
    return Math.round((uncompletedCount / regrets.length) * 100);
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={[styles.title, { marginTop: 20 }]}>Loading...</Text>
      </View>
    );
  }

  // Show registration screen if not authenticated
  if (!isAuthenticated) {
    return <Registration onRegistrationComplete={handleRegistrationComplete} />;
  }

  // Show settings screen
  if (currentScreen === 'settings') {
    return (
      <Settings 
        onBack={() => setCurrentScreen('main')} 
        username={username}
      />
    );
  }

  // Show main checklist if authenticated
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerCenter}>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
          <Text style={styles.title}>Regret Regret</Text>
          <Text style={styles.subtitle}>Regret Index: {calculateRegretIndex()}%</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setCurrentScreen('settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <Checklist onRegretsUpdate={handleRegretsUpdate} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 60,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
  dateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  }
});
