import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ActivityIndicator, Image, TextStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './api/services/authService';
import Registration from './components/Registration';
import Checklist from './components/Checklist';
import Settings from './components/Settings';
import RegretHistory from './components/RegretHistory';
import Network from './components/Network';
import Layout from './components/Layout';
import WelcomePopup from './components/WelcomePopup';
import { Screen } from './components/types';
import { Regret } from './api/types';

export const getRegretIndexColor = (value: number) => {
  if (value <= 0) return '#4CAF50';  // Green
  if (value >= 100) return '#f44336'; // Red
  
  if (value <= 25) {
    // Green to Light Green
    return '#8BC34A';
  } else if (value <= 50) {
    // Light Green to Yellow
    return '#FFEB3B';
  } else if (value <= 75) {
    // Yellow to Orange
    return '#FF9800';
  } else {
    // Orange to Red
    return '#FF5722';
  }
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [regrets, setRegrets] = useState<Regret[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [username, setUsername] = useState<string>('');
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkWelcomePopupStatus();
    }
  }, [isAuthenticated]);

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

  const checkWelcomePopupStatus = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        setShowWelcomePopup(true);
      }
    } catch (error) {
      console.error('Failed to check welcome popup status:', error);
    }
  };

  const handleWelcomePopupClose = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      setShowWelcomePopup(false);
    } catch (error) {
      console.error('Failed to save welcome popup status:', error);
    }
  };

  const handleRegistrationComplete = async () => {
    // Verify authentication after registration
    await checkAuthStatus();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      await AsyncStorage.removeItem('hasSeenWelcome');
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
    if (regrets.length === 0) return -1; // Special value to indicate no items
    const uncompletedCount = regrets.filter(r => !r.success).length;
    return Math.round((uncompletedCount / regrets.length) * 100);
  };

  const formatRegretIndex = (index: number): { text: string; color: string; style: TextStyle } => {
    if (index === -1) return { text: 'SLACKER', color: '#f44336', style: { fontWeight: 'bold' } };
    return { text: `${index}%`, color: getRegretIndexColor(index), style: {} };
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

  const renderCurrentScreen = () => {
    const regretIndex = calculateRegretIndex();
    
    switch (currentScreen) {
      case 'settings':
        return (
          <Settings 
            username={username}
            onLogout={handleLogout}
          />
        );
      case 'history':
        return <RegretHistory currentRegretIndex={regretIndex} />;
      case 'network':
        return <Network currentRegretIndex={regretIndex} />;
      default:
        return (
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Regret Regret</Text>
            </View>
            
            <View style={styles.subheaderInfo}>
              <Image 
                source={require('./assets/frog_2.jpeg')}
                style={styles.frogImage}
                resizeMode="contain"
              />
              <View style={styles.textInfo}>
                <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
                {(() => {
                  const { text, color, style } = formatRegretIndex(regretIndex);
                  return (
                    <Text style={[styles.subtitle, { color }, style]}>
                      Regret Index: {text}
                    </Text>
                  );
                })()}
              </View>
            </View>

            <Checklist onRegretsUpdate={handleRegretsUpdate} />
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Layout currentScreen={currentScreen} setCurrentScreen={setCurrentScreen}>
        {renderCurrentScreen()}
      </Layout>
      <WelcomePopup visible={showWelcomePopup} onClose={handleWelcomePopupClose} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  subheaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  frogImage: {
    width: 45,
    height: 45,
    marginRight: 15,
  },
  textInfo: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
