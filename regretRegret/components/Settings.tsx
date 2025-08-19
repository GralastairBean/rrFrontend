import { StyleSheet, Text, View, TouchableOpacity, Switch, Alert, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme, colors } from '../utils/ThemeContext';
import { getTimezoneInfo } from '../utils/datetime';
import { networkService } from '../api/services/networkService';

interface SettingsProps {
  username: string;
  onLogout: () => void;
}

export default function Settings({ username, onLogout }: SettingsProps) {
  const [allowNetworking, setAllowNetworking] = useState(true);
  const [isLoadingNetworking, setIsLoadingNetworking] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];

  // Load current networking settings on component mount
  useEffect(() => {
    // Since backend doesn't support GET for networking settings,
    // we'll start with networking enabled by default
    // The actual status will be reflected when users try to follow you
    setAllowNetworking(true);
  }, []);

  // Handle networking settings change
  const handleNetworkingChange = async (value: boolean) => {
    console.log('🔄 Toggle clicked, new value:', value);
    console.log('🔄 Current state before change:', allowNetworking);
    
    setIsLoadingNetworking(true);
    try {
      const result = await networkService.updateNetworkingSettings(value);
      console.log('🔄 API response:', result);
      
      // Check if the response contains the allow_networking field
      if (result.allow_networking !== undefined) {
        console.log('✅ Successfully updated networking to:', result.allow_networking);
        setAllowNetworking(result.allow_networking);
        // No popup needed - toggle movement provides clear feedback
      } else {
        console.log('❌ Backend response missing allow_networking field');
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error) {
      console.error('❌ API call failed:', error);
      Alert.alert('Error', 'Failed to update networking settings');
    } finally {
      setIsLoadingNetworking(false);
    }
  };

  // Safe timezone info getter with fallback
  const getSafeTimezoneInfo = (): string => {
    try {
      return getTimezoneInfo();
    } catch (error) {
      console.warn('Failed to get timezone info:', error);
      return 'UTC+00:00 (Manual Timezone)';
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Log Out',
          onPress: onLogout,
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.primary }]}>Settings</Text>
      </View>

      <View style={[styles.userInfo, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>Username</Text>
        <View style={styles.usernameContainer}>
          <Image 
            source={require('../assets/user_1.png')}
            style={[styles.userIcon, { tintColor: themeColors.primary }]}
            resizeMode="contain"
          />
          <Text style={[styles.username, { color: themeColors.text }]}>{username}</Text>
        </View>
      </View>

      <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Timezone</Text>
        <Text style={[styles.timezoneValue, { color: themeColors.textSecondary }]}>
          {getSafeTimezoneInfo()}
        </Text>
      </View>

      <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Dark Mode</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: themeColors.border, true: themeColors.primary }}
          thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
        <View style={styles.settingLeft}>
          <Text style={[styles.settingLabel, { color: themeColors.text }]}>Allow Networking</Text>
          <Text style={[styles.settingDescription, { color: themeColors.textSecondary }]}>
            If enabled, other users can add you to their network and your daily regret index will be visible
          </Text>
        </View>
        <Switch
          value={allowNetworking}
          onValueChange={handleNetworkingChange}
          trackColor={{ false: themeColors.border, true: themeColors.primary }}
          thumbColor={allowNetworking ? '#fff' : '#f4f3f4'}
        />
      </View>
      {isLoadingNetworking && (
        <View style={styles.updatingContainer}>
          <Text style={styles.updatingText}>Updating...</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
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
  },
  username: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  timezoneValue: {
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 10,
  },
  updatingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  updatingText: {
    fontSize: 14,
    color: '#888',
  },
}); 