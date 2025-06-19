import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ActivityIndicator, Image, TextStyle, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
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
import { ThemeProvider, useTheme, colors } from './utils/ThemeContext';

export const getRegretIndexColor = (value: number | null) => {
  if (value === null) return '#121212';  // Default color during loading
  if (value <= 0) return '#4CAF50';  // Green
  if (value >= 100) return '#f44336'; // Red
  
  if (value <= 25) {
    // Green to Light Green
    return '#8BC34A';
  } else if (value <= 50) {
    // Light Green to Yellow - Using a darker yellow for better visibility
    return '#E6B800';  // Darker yellow
  } else if (value <= 75) {
    // Yellow to Orange
    return '#FF9800';
  } else {
    // Orange to Red
    return '#FF5722';
  }
};

function AppContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [regrets, setRegrets] = useState<Regret[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [username, setUsername] = useState<string>('');
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [lastCalculatedRegretIndex, setLastCalculatedRegretIndex] = useState<number | null>(-1);
  const { theme } = useTheme();
  const themeColors = colors[theme];
  const appState = useRef(AppState.currentState);
  const [shouldRefreshChecklist, setShouldRefreshChecklist] = useState(false);

  // Clear regrets data when changing screens
  useEffect(() => {
    if (currentScreen !== 'main') {
      setRegrets([]);
    }
  }, [currentScreen]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkWelcomePopupStatus();
    }
  }, [isAuthenticated]);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('🔄 App State Changed:', { from: appState.current, to: nextAppState });
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active' &&
        isAuthenticated
      ) {
        // App has come to foreground - update date and trigger checklist refresh
        console.log('📱 App came to foreground, updating date and triggering refresh');
        setCurrentDate(new Date()); // Update date to match what we'll send to backend
        setShouldRefreshChecklist(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  // Reset refresh trigger after it's been consumed
  useEffect(() => {
    if (shouldRefreshChecklist) {
      console.log('🔄 Resetting refresh trigger');
      setShouldRefreshChecklist(false);
    }
  }, [shouldRefreshChecklist]);

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
      await AsyncStorage.removeItem('hasSeenRegretConfirmation');
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

  const handleRegretsUpdate = (updatedRegrets: Regret[], isLoading: boolean) => {
    // Only update regrets if we're on the main screen
    if (currentScreen === 'main') {
      setRegrets(updatedRegrets);
      setChecklistLoading(isLoading);
      
      // Calculate and store the regret index when data is loaded
      if (!isLoading) {
        if (updatedRegrets.length === 0) {
          setLastCalculatedRegretIndex(-1);
        } else {
          const uncompletedCount = updatedRegrets.filter(r => !r.success).length;
          const newIndex = Math.round((uncompletedCount / updatedRegrets.length) * 100);
          setLastCalculatedRegretIndex(newIndex);
        }
      } else {
        // During loading, set to null to prevent flash
        setLastCalculatedRegretIndex(null);
      }
    }
  };

  const calculateRegretIndex = () => {
    if (currentScreen === 'main') {
      if (checklistLoading) return null;
      if (regrets.length === 0) return -1;
      const uncompletedCount = regrets.filter(r => !r.success).length;
      return Math.round((uncompletedCount / regrets.length) * 100);
    }
    // Use the last calculated index for other screens
    return lastCalculatedRegretIndex;
  };

  const formatRegretIndex = (index: number | null): { text: string; color: string; style: TextStyle } => {
    if (index === null) return { text: '', color: themeColors.text, style: {} };
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
        return <RegretHistory currentRegretIndex={regretIndex ?? -1} />;
      case 'network':
        return <Network currentRegretIndex={regretIndex ?? -1} />;
      default:
        return (
          <View style={[styles.mainContent, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: themeColors.primary }]}>Regret Regret</Text>
            </View>
            
            <View style={styles.subheaderInfo}>
              <Image 
                source={require('./assets/frogCircle_2.png')}
                style={styles.frogImage}
                resizeMode="contain"
              />
              <View style={styles.textInfo}>
                <Text style={[styles.dateText, { color: themeColors.text }]}>{formatDate(currentDate)}</Text>
                <View style={styles.regretIndexContainer}>
                  {currentScreen === 'main' && (
                    <Text style={[styles.subtitle, { color: formatRegretIndex(regretIndex).color }]}>
                      Regret Index: {formatRegretIndex(regretIndex).text}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <Checklist 
              onRegretsUpdate={handleRegretsUpdate} 
              shouldRefresh={shouldRefreshChecklist}
            />
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar style={theme === 'dark' ? "light" : "dark"} />
      <Layout currentScreen={currentScreen} setCurrentScreen={setCurrentScreen}>
        {renderCurrentScreen()}
      </Layout>
      <WelcomePopup visible={showWelcomePopup} onClose={handleWelcomePopupClose} />
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
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
    textAlign: 'center',
  },
  subheaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  frogImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  textInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    marginBottom: 5,
  },
  regretIndexContainer: {
    minHeight: 24,  // Set a fixed height for the container
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
});
