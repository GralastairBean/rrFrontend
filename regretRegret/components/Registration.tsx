import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useState } from 'react';
import { authService } from '../api/services/authService';

interface RegistrationProps {
  onRegistrationComplete: () => void;
}

export default function Registration({ onRegistrationComplete }: RegistrationProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (username.trim().length === 0) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(username.trim());
      onRegistrationComplete();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Registration Failed', error.message);
      } else {
        Alert.alert('Registration Failed', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Image 
        source={require('../assets/frog_1.png')}
        style={styles.frogImage}
        resizeMode="contain"
      />
      <Text 
        style={styles.motto}
        numberOfLines={1}
      >
        the better you has less regret (regret)...
      </Text>
      <Text style={styles.welcomeText}>choose a username to begin</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardAppearance="dark"
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[
            styles.button,
            (username.trim().length === 0 || isLoading) && styles.buttonDisabled
          ]} 
          onPress={handleRegister}
          disabled={username.trim().length === 0 || isLoading}
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
  frogImage: {
    width: '100%',
    maxWidth: 400,
    height: undefined,
    aspectRatio: 1,
    marginBottom: 20,
    marginTop: 10,
  },
  motto: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    flexShrink: 1,
  },
  welcomeText: {
    fontSize: 20,
    color: '#fff',
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