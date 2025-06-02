import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useChecklist } from '../hooks/useChecklist';
import { Regret } from '../api/types';

interface ChecklistProps {
  onRegretsUpdate?: (regrets: Regret[]) => void;
}

export default function Checklist({ onRegretsUpdate }: ChecklistProps) {
  const [newRegret, setNewRegret] = useState('');
  const { checklist, regrets, loading, error, createRegret, toggleRegretSuccess } = useChecklist({ today: true });

  useEffect(() => {
    if (onRegretsUpdate) {
      onRegretsUpdate(regrets);
    }
  }, [regrets, onRegretsUpdate]);

  const handleAddRegret = async () => {
    if (newRegret.trim().length === 0) return;
    
    try {
      await createRegret(newRegret.trim());
      setNewRegret('');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleToggleRegret = async (regretId: number, currentSuccess: boolean) => {
    // Only allow toggling if the regret is not already successful
    if (!currentSuccess) {
      await toggleRegretSuccess(regretId);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={[styles.title, { marginTop: 20 }]}>Loading today's checklist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newRegret}
          onChangeText={setNewRegret}
          placeholder="Add a new regret..."
          placeholderTextColor="#666"
          keyboardAppearance="dark"
        />
        <TouchableOpacity 
          style={[
            styles.addButton,
            newRegret.trim().length === 0 && styles.buttonDisabled
          ]} 
          onPress={handleAddRegret}
          disabled={newRegret.trim().length === 0}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        data={regrets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.regretItem}>
            <TouchableOpacity 
              style={[
                styles.checkbox,
                item.success && styles.checkboxDisabled
              ]} 
              onPress={() => handleToggleRegret(item.id, item.success)}
              disabled={item.success}
            >
              {item.success && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={[
              styles.regretText,
              item.success && styles.completedRegret
            ]}>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#4CAF50',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
    backgroundColor: '#1E1E1E',
    color: '#fff',
  },
  addButton: {
    width: 48,
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
  addButtonText: {
    color: '#121212',
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  regretItem: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDisabled: {
    borderColor: '#1b5e20',
    backgroundColor: '#1b5e20',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  regretText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  completedRegret: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
}); 