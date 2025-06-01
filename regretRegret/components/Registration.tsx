import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { authService } from '../api/services/authService';

interface RegistrationProps {
  onRegistrationComplete: () => void;
}

export default function Registration({ onRegistrationComplete }: RegistrationProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (username.trim().length === 0 || password.trim().length === 0) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({
        username: username.trim(),
        password: password.trim()
      });
      onRegistrationComplete();
    } catch (error) {
      Alert.alert('Registration Failed', 'Please try again with a different username');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.title}>Welcome to Regret Regret</Text>
      <Text style={styles.subtitle}>Create your account</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardAppearance="dark"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Choose a password"
          placeholderTextColor="#666"
          secureTextEntry
          keyboardAppearance="dark"
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[
            styles.button,
            (username.trim().length === 0 || password.trim().length === 0 || isLoading) && styles.buttonDisabled
          ]} 
          onPress={handleRegister}
          disabled={username.trim().length === 0 || password.trim().length === 0 || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#1E1E1E',
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    height: 48,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
    borderWidth: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 