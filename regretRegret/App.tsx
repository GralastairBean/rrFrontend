import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { authService } from './api/services/authService';
import Registration from './components/Registration';
import Checklist from './components/Checklist';
import Settings from './components/Settings';
import RegretHistory from './components/RegretHistory';
import Network from './components/Network';
import Layout from './components/Layout';
import { Screen } from './components/types';
import { Regret } from './api/types';

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

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'settings':
        return (
          <Settings 
            username={username}
            onLogout={handleLogout}
          />
        );
      case 'history':
        return <RegretHistory />;
      case 'network':
        return <Network />;
      default:
        return (
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
  headerCenter: {
    alignItems: 'center',
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
});
