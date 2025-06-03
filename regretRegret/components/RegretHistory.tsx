import { StyleSheet, Text, View } from 'react-native';

export default function RegretHistory() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Regret Index History</Text>
      </View>

      {/* TODO: Add graph/chart content here */}
      <View style={styles.content}>
        <Text style={styles.placeholder}>Graph coming soon...</Text>
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
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
}); 