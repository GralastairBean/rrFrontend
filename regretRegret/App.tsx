import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { authService } from './api/services/authService';
import Registration from './components/Registration';
import Checklist from './components/Checklist';
import Settings from './components/Settings';
import RegretHistory from './components/RegretHistory';
import Network from './components/Network';
import { Regret } from './api/types';

type Screen = 'main' | 'settings' | 'history' | 'network';

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

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUsername('');
      setCurrentScreen('main');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
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
        onLogout={handleLogout}
      />
    );
  }

  // Show history screen
  if (currentScreen === 'history') {
    return (
      <RegretHistory 
        onBack={() => setCurrentScreen('main')}
      />
    );
  }

  // Show network screen
  if (currentScreen === 'network') {
    return (
      <Network 
        onBack={() => setCurrentScreen('main')}
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
      <View style={styles.mainContent}>
        <View style={styles.headerCenter}>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
          <View style={styles.titleContainer}>
            <Image 
              source={require('./assets/frog_2.jpeg')}
              style={styles.frogImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Regret Regret</Text>
          </View>
          <Text style={styles.subtitle}>Regret Index: {calculateRegretIndex()}%</Text>
        </View>
        <Checklist onRegretsUpdate={handleRegretsUpdate} />
      </View>
      
      <View style={styles.bottomSection}>
        <View style={styles.separator} />
        <View style={styles.iconRow}>
          <TouchableOpacity 
            style={[styles.iconButton, styles.userIconButton]}
            onPress={() => setCurrentScreen('network')}
          >
            <Image 
              source={require('./assets/network_1.png')}
              style={[styles.iconImage, styles.userIconImage]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setCurrentScreen('history')}
          >
            <Image 
              source={require('./assets/graph_1.png')}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setCurrentScreen('settings')}
          >
            <Image 
              source={require('./assets/settings_1.png')}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 60,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    paddingTop: 20,
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    width: '100%',
    marginBottom: 20,
  },
  headerCenter: {
    alignItems: 'center',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  frogImage: {
    width: 60,
    height: 60,
    marginRight: 10,
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
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 30,
  },
  iconButton: {
    width: 62,
    height: 62,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 37,
    height: 37,
  },
  userIconButton: {
    width: 56,
    height: 56,
  },
  userIconImage: {
    width: 33,
    height: 33,
  },
});
