import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, colors } from '../utils/ThemeContext';

interface RegretConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const RegretConfirmationModal: React.FC<RegretConfirmationModalProps> = ({ 
  visible, 
  onConfirm, 
  onCancel 
}) => {
  const { theme } = useTheme();
  const themeColors = colors[theme];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.title, { color: themeColors.primary }]}>Complete Regret?</Text>
          <Text style={[styles.message, { color: themeColors.text }]}>
            Regret Regret is a permanent record. Ticking off a regret cannot be undone.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: themeColors.primary }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '85%',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default RegretConfirmationModal; 