import { StyleSheet, Text, View, Image } from 'react-native';
import { authService } from '../api/services/authService';
import { useState, useEffect } from 'react';

export default function Network() {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const loadUsername = async () => {
      const storedUsername = await authService.getStoredUsername();
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    loadUsername();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.usernameContainer}>
          <Image 
            source={require('../assets/user_1.png')}
            style={styles.userIcon}
            resizeMode="contain"
          />
          <Text style={styles.username}>{username}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.subtitle}>Daily Croak Subscribers</Text>
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
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#888',
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
    tintColor: '#4CAF50',
  },
  username: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
}); 