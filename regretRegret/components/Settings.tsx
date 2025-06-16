import { StyleSheet, Text, View, TouchableOpacity, Switch, Alert, Image, Platform, Pressable, Modal } from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, colors } from '../utils/ThemeContext';

interface SettingsProps {
  username: string;
  onLogout: () => void;
}

export default function Settings({ username, onLogout }: SettingsProps) {
  const [sendDailyCroak, setSendDailyCroak] = useState(false);
  const [endOfDay, setEndOfDay] = useState(new Date(new Date().setHours(23, 59)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempTime(selectedDate);
    }
  };

  const handleOpenTimePicker = () => {
    setTempTime(endOfDay);
    setShowTimePicker(true);
  };

  const handleConfirmTime = () => {
    setEndOfDay(tempTime);
    setShowTimePicker(false);
  };

  const handleCancelTime = () => {
    setShowTimePicker(false);
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

      <View style={[styles.settingItem, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.settingLabel, { color: themeColors.text }]}>End of Day</Text>
        <Pressable onPress={handleOpenTimePicker} style={[styles.timeButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.timeText, { color: themeColors.primary }]}>{formatTime(endOfDay)}</Text>
        </Pressable>
      </View>

      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.primary }]}>Select End of Day Time</Text>
            <DateTimePicker
              value={tempTime}
              mode="time"
              is24Hour={false}
              display="spinner"
              onChange={handleTimeChange}
              style={styles.timePicker}
              textColor={themeColors.text}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} 
                onPress={handleCancelTime}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleConfirmTime}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  timeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '85%',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
  },
  timePicker: {
    height: 200,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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