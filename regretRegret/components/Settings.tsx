import { StyleSheet, Text, View, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';

interface SettingsProps {
  onBack: () => void;
  username: string;
}

export default function Settings({ onBack, username }: SettingsProps) {
  const [testEnabled, setTestEnabled] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.label}>Username</Text>
        <Text style={styles.username}>{username}</Text>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Test</Text>
        <Switch
          value={testEnabled}
          onValueChange={setTestEnabled}
          trackColor={{ false: '#333', true: '#4CAF50' }}
          thumbColor={testEnabled ? '#fff' : '#f4f3f4'}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  username: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
}); 