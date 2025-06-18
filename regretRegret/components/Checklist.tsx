import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChecklist } from '../hooks/useChecklist';
import { Regret } from '../api/types';
import ParticleSystem from './ParticleSystem';
import RegretConfirmationModal from './RegretConfirmationModal';
import { playCheckSound } from '../utils/sound';
import { useTheme, colors } from '../utils/ThemeContext';

interface ChecklistProps {
  onRegretsUpdate?: (regrets: Regret[], isLoading: boolean) => void;
  shouldRefresh?: boolean;
}

const RegretItem = memo(({ 
  item, 
  onToggle 
}: { 
  item: Regret; 
  onToggle: (id: number, success: boolean) => void;
}) => {
  const [showParticles, setShowParticles] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const checkboxRef = useRef<View>(null);
  const { theme } = useTheme();
  const themeColors = colors[theme];

  const handleToggleAttempt = useCallback(async () => {
    if (item.success) return;

    try {
      const hasSeenConfirmation = await AsyncStorage.getItem('hasSeenRegretConfirmation');
      if (!hasSeenConfirmation) {
        setShowConfirmation(true);
      } else {
        handleConfirmedToggle();
      }
    } catch (error) {
      console.error('Failed to check confirmation status:', error);
      // Fallback to showing confirmation
      setShowConfirmation(true);
    }
  }, [item.success]);

  const handleConfirmedToggle = useCallback(async () => {
    try {
      await AsyncStorage.setItem('hasSeenRegretConfirmation', 'true');
      setShowConfirmation(false);
      setShowParticles(true);
      await playCheckSound();
      onToggle(item.id, item.success);
      setTimeout(() => {
        setShowParticles(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save confirmation status:', error);
    }
  }, [item.id, item.success, onToggle]);

  const handleCancelToggle = () => {
    setShowConfirmation(false);
  };

  return (
    <View style={[
      styles.regretItem,
      {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      }
    ]}>
      <View style={styles.contentContainer}>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            onPress={handleToggleAttempt}
            disabled={item.success}
          >
            <View
              ref={checkboxRef}
              style={[
                styles.checkbox,
                { borderColor: themeColors.primary },
                item.success && [styles.checkboxDisabled, { backgroundColor: themeColors.primary }]
              ]}
            >
              {item.success && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          {showParticles && (
            <ParticleSystem
              count={20}
              color={themeColors.primary}
            />
          )}
        </View>
        <Text style={[
          styles.regretText,
          { color: themeColors.text },
          item.success && { 
            color: themeColors.textSecondary,
            textDecorationLine: 'line-through'
          }
        ]}>{item.description}</Text>
      </View>
      <RegretConfirmationModal
        visible={showConfirmation}
        onConfirm={handleConfirmedToggle}
        onCancel={handleCancelToggle}
      />
    </View>
  );
});

const Checklist = ({ onRegretsUpdate, shouldRefresh }: ChecklistProps) => {
  const [newRegret, setNewRegret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checklist, regrets, loading, error, createRegret, toggleRegretSuccess, refreshChecklist, getTodayChecklist } = useChecklist();
  const { theme } = useTheme();
  const themeColors = colors[theme];

  useEffect(() => {
    // Use the new POST method to get today's checklist on component mount
    getTodayChecklist();
  }, [getTodayChecklist]);

  useEffect(() => {
    if (shouldRefresh) {
      console.log('🔄 Refreshing checklist due to app focus');
      getTodayChecklist();
    }
  }, [shouldRefresh, getTodayChecklist]);

  useEffect(() => {
    if (onRegretsUpdate) {
      console.log('📝 Regrets updated:', { count: regrets.length, loading });
      onRegretsUpdate(regrets, loading);
    }
  }, [regrets, onRegretsUpdate, loading]);

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
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.title, { color: themeColors.text, marginTop: 20 }]}>Loading today's checklist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.text,
            }
          ]}
          value={newRegret}
          onChangeText={setNewRegret}
          placeholder="Add a new regret..."
          placeholderTextColor={themeColors.textSecondary}
          returnKeyType="done"
          onSubmitEditing={handleAddRegret}
          editable={!isSubmitting}
          keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: newRegret.trim().length === 0 || isSubmitting
                ? themeColors.surface
                : themeColors.primary,
              borderColor: themeColors.border,
            }
          ]}
          onPress={handleAddRegret}
          disabled={newRegret.trim().length === 0 || isSubmitting}
        >
          <Text style={[
            styles.addButtonText,
            {
              color: newRegret.trim().length === 0 || isSubmitting
                ? themeColors.textSecondary
                : themeColors.buttonText
            }
          ]}>
            {isSubmitting ? 'Adding...' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={regrets}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  regretItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    position: 'relative',
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDisabled: {
    borderWidth: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  regretText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default Checklist; 