import { StyleSheet, Text, View } from 'react-native';

export default function Network() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
    paddingHorizontal: 20,
    marginBottom: 20,
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