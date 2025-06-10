import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { authService } from '../api/services/authService';
import { useTheme, colors } from '../utils/ThemeContext';
import { handleApiError } from '../api/utils/errorHandling';

interface RegistrationProps {
  onRegistrationComplete: () => void;
}

export default function Registration({ onRegistrationComplete }: RegistrationProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const themeColors = colors[theme];

  const handleRegister = async () => {
    if (username.trim().length === 0) {
      Alert.alert('Sorry', 'Please enter a username');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(username.trim());
      onRegistrationComplete();
    } catch (error) {
      // The error will already be shown by the error handling utility
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <Image 
        source={require('../assets/frog_1.png')}
        style={styles.frogImage}
        resizeMode="contain"
      />
      
      <View style={styles.form}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            color: themeColors.text,
          }]}
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username to begin"
          placeholderTextColor={themeColors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[
            styles.button,
            (username.trim().length === 0 || isLoading) && [
              styles.buttonDisabled,
              { 
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              }
            ]
          ]} 
          onPress={handleRegister}
          disabled={username.trim().length === 0 || isLoading}
        >
          <Text style={[
            styles.buttonText,
            (username.trim().length === 0 || isLoading) && { color: themeColors.textSecondary }
          ]}>
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
    paddingTop: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  frogImage: {
    width: '100%',
    maxWidth: 400,
    height: undefined,
    aspectRatio: 1,
    marginBottom: 5,
    marginTop: 0,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    height: 48,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 