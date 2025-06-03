import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface NetworkProps {
  onBack: () => void;
}

export default function Network({ onBack }: NetworkProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Network</Text>
      </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
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
  subtitle: {
    fontSize: 18,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
}); 