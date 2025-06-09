import React, { useState, useEffect, useCallback, memo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useChecklist } from '../hooks/useChecklist';
import { Regret } from '../api/types';

interface ChecklistProps {
  onRegretsUpdate?: (regrets: Regret[]) => void;
}

const RegretItem = memo(({ 
  item, 
  onToggle 
}: { 
  item: Regret; 
  onToggle: (id: number, success: boolean) => void;
}) => (
  <View style={styles.regretItem}>
    <TouchableOpacity 
      style={[
        styles.checkbox,
        item.success && styles.checkboxDisabled
      ]} 
      onPress={() => onToggle(item.id, item.success)}
      disabled={item.success}
    >
      {item.success && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
    <Text style={[
      styles.regretText,
      item.success && styles.completedRegret
    ]}>{item.description}</Text>
  </View>
));

const Checklist = ({ onRegretsUpdate }: ChecklistProps) => {
  const [newRegret, setNewRegret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checklist, regrets, loading, error, createRegret, toggleRegretSuccess } = useChecklist({ today: true });

  useEffect(() => {
    if (onRegretsUpdate) {
      onRegretsUpdate(regrets);
    }
  }, [regrets, onRegretsUpdate]);

  const handleAddRegret = useCallback(async () => {
    if (newRegret.trim().length === 0 || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await createRegret(newRegret.trim());
      setNewRegret('');
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [newRegret, createRegret, isSubmitting]);

  const handleToggleRegret = useCallback(async (regretId: number, currentSuccess: boolean) => {
    // Only allow toggling if the regret is not already successful
    if (!currentSuccess) {
      await toggleRegretSuccess(regretId);
    }
  }, [toggleRegretSuccess]);

  const keyExtractor = useCallback((item: Regret) => item.id.toString(), []);

  const renderItem = useCallback(({ item }: { item: Regret }) => (
    <RegretItem item={item} onToggle={handleToggleRegret} />
  ), [handleToggleRegret]);

  if (loading && regrets.length === 0) {
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
          editable={!isSubmitting}
        />
        <TouchableOpacity 
          style={[
            styles.addButton,
            (newRegret.trim().length === 0 || isSubmitting) && styles.buttonDisabled
          ]} 
          onPress={handleAddRegret}
          disabled={newRegret.trim().length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <Text style={styles.addButtonText}>+</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        data={regrets}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

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
    paddingHorizontal: 10,
    marginBottom: 20,
    width: '100%',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#1E1E1E',
    color: '#fff',
    marginRight: 15,
  },
  addButton: {
    width: 80,
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
    fontSize: 32,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    paddingHorizontal: 10,
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

export default memo(Checklist); 