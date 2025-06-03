import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Screen } from './types';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
}

export default function Layout({ children, currentScreen, setCurrentScreen }: LayoutProps) {
  const getIconStyle = (screen: Screen) => {
    return [
      styles.iconImage,
      currentScreen === screen && styles.activeIcon
    ];
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      
      <View style={styles.bottomSection}>
        <View style={styles.separator} />
        <View style={styles.iconRow}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Image 
              source={require('../assets/home_1.png')}
              style={getIconStyle('main')}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setCurrentScreen('network')}
          >
            <Image 
              source={require('../assets/network_1.png')}
              style={getIconStyle('network')}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setCurrentScreen('history')}
          >
            <Image 
              source={require('../assets/graph_1.png')}
              style={getIconStyle('history')}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setCurrentScreen('settings')}
          >
            <Image 
              source={require('../assets/settings_1.png')}
              style={getIconStyle('settings')}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Add padding to prevent content from being hidden behind the navigation bar
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    width: '100%',
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
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
    tintColor: '#888',
  },
  activeIcon: {
    tintColor: '#4CAF50',
  },
}); 