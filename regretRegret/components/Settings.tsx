import { StyleSheet, Text, View, TouchableOpacity, Switch, Alert, Image } from 'react-native';
import { useState } from 'react';
import { useTheme, colors } from '../utils/ThemeContext';

interface SettingsProps {
  username: string;
  onLogout: () => void;
}

export default function Settings({ username, onLogout }: SettingsProps) {
  const [sendDailyCroak, setSendDailyCroak] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];

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
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Dark Mode</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{ false: themeColors.border, true: themeColors.primary }}
          thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>Send Daily Croak</Text>
        <Switch
          value={sendDailyCroak}
          onValueChange={setSendDailyCroak}
          trackColor={{ false: themeColors.border, true: themeColors.primary }}
          thumbColor={sendDailyCroak ? '#fff' : '#f4f3f4'}
        />
      </View>

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
  settingLabel: {
    fontSize: 16,
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
}); 