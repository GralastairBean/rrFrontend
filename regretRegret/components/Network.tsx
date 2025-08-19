import { StyleSheet, Text, View, Image, TextStyle, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { authService } from '../api/services/authService';
import { networkService, NetworkUser } from '../api/services/networkService';
import { useState, useEffect } from 'react';
import { getRegretIndexColor } from '../App';
import { useTheme, colors } from '../utils/ThemeContext';

interface NetworkProps {
  currentRegretIndex: number;
}

const formatRegretIndex = (index: number): { text: string; color: string; style: TextStyle } => {
  if (index === -1) return { text: 'SLACKER', color: '#f44336', style: { fontWeight: 'bold' } };
  return { text: `${index}%`, color: getRegretIndexColor(index), style: {} };
};

// Utility function to check if a UTC date is from today in user's local timezone
const isChecklistFromToday = (utcDate: string): boolean => {
  try {
    // Parse UTC date from backend
    const utcDateTime = new Date(utcDate);
    
    // Get today's date in user's local timezone
    const today = new Date();
    
    // Convert UTC date to local date string
    const checklistLocalDate = utcDateTime.toDateString();
    
    // Compare dates (ignore time)
    const isToday = checklistLocalDate === today.toDateString();
    
    return isToday;
  } catch (error) {
    console.error('Date comparison failed:', error);
    return false;
  }
};

// Utility function to get the most recent checklist for today
const getLatestTodayChecklist = (checklists: any[]): any => {
  const todayChecklists = checklists.filter(checklist => 
    checklist.checklist_created_at && isChecklistFromToday(checklist.checklist_created_at)
  );
  
  if (todayChecklists.length === 0) return null;
  
  // Sort by creation time and return the latest
  return todayChecklists.sort((a, b) => 
    new Date(b.checklist_created_at).getTime() - new Date(a.checklist_created_at).getTime()
  )[0];
};

export default function Network({ currentRegretIndex }: NetworkProps) {
  const [username, setUsername] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkUsers, setNetworkUsers] = useState<NetworkUser[]>([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(true);
  const { theme } = useTheme();
  const themeColors = colors[theme];

  useEffect(() => {
    const loadUsername = async () => {
      const storedUsername = await authService.getStoredUsername();
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    loadUsername();
    loadNetworkUsers();
  }, []);

  const loadNetworkUsers = async () => {
    try {
      setIsLoadingNetwork(true);
      const users = await networkService.getFollowingUsers();
      console.log('📋 Loaded network users:', users);
      console.log('📋 First user structure:', users[0]);
      
      // Debug: Show local date comparison for each user
      users.forEach(user => {
        // No logging here - we'll see it in the user processing logs
      });
      
      setNetworkUsers(users);
    } catch (error) {
      console.error('Error loading network users:', error);
      // Don't show error alert for initial load
    } finally {
      setIsLoadingNetwork(false);
    }
  };

  const { text, color, style } = formatRegretIndex(currentRegretIndex);

  const handleAddToNetwork = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewUsername('');
    setIsLoading(false);
  };

  const handleAddUser = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔍 Validating username:', newUsername);
      
      // First validate the username
      const validation = await networkService.validateUsernameForNetwork(newUsername);
      
      console.log('📋 Validation response:', validation);
      
      // Backend returns user_id if user exists, so check for that
      if (!validation.user_id) {
        Alert.alert('User Not Found', 'This username does not exist.');
        return;
      }
      
      if (!validation.allow_networking) {
        Alert.alert('Networking Disabled', 'This user has networking disabled.');
        return;
      }
      
      // Check if we're trying to follow ourselves
      if (validation.username === username) {
        Alert.alert('Cannot Follow', 'You cannot follow yourself.');
        return;
      }

      console.log('✅ Username validation passed, following user...');

      // Follow the user
      const followResult = await networkService.followUser(newUsername);
      
      console.log('👥 Follow result:', followResult);
      
      if (followResult.success) {
        Alert.alert('Success', `Added ${newUsername} to your network!`);
        handleCloseModal();
        
        console.log('🔄 Reloading network users after successful follow...');
        // Reload network users to show the new addition
        await loadNetworkUsers();
        console.log('✅ Network users reloaded');
      } else {
        Alert.alert('Error', followResult.message || 'Failed to add user to network');
      }
      
    } catch (error: any) {
      console.error('❌ Error adding user to network:', error);
      console.error('❌ Error details:', error.response?.data);
      
      // Show specific error message from backend if available
      if (error.response?.data?.error) {
        Alert.alert('Error', error.response.data.error);
      } else {
        Alert.alert('Error', 'Failed to add user to network. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollowUser = async (userId: number, username: string) => {
    Alert.alert(
      'Unfollow User',
      `Are you sure you want to unfollow ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            try {
              await networkService.unfollowUser(username);
              Alert.alert('Success', `Unfollowed ${username}`);
              loadNetworkUsers(); // Reload the list
            } catch (error) {
              console.error('Error unfollowing user:', error);
              Alert.alert('Error', 'Failed to unfollow user');
            }
          }
        }
      ]
    );
  };

  const renderNetworkUser = ({ item }: { item: NetworkUser }) => {
    // First check if this checklist is from today
    let isToday = false;
    if (item.checklist_created_at) {
      isToday = isChecklistFromToday(item.checklist_created_at);
    }
    
    // Handle the regret index display based on date comparison
    let regretIndex: number;
    let displayText: string;
    
    if (!isToday) {
      // Checklist is not from today - show SLACKER
      regretIndex = -1;
      displayText = 'SLACKER';
    } else {
      // Checklist is from today - show the actual score
      if (typeof item.regret_index === 'string') {
        const parsed = parseFloat(item.regret_index);
        if (isNaN(parsed)) {
          regretIndex = -1;
          displayText = 'SLACKER';
        } else {
          regretIndex = Math.round(parsed * 100);
          displayText = `${regretIndex}%`;
        }
      } else if (typeof item.regret_index === 'number') {
        if (item.regret_index >= 0 && item.regret_index <= 1) {
          regretIndex = Math.round(item.regret_index * 100);
          displayText = `${regretIndex}%`;
        } else if (item.regret_index >= 0 && item.regret_index <= 100) {
          regretIndex = item.regret_index;
          displayText = `${regretIndex}%`;
        } else {
          regretIndex = -1;
          displayText = 'SLACKER';
        }
      } else {
        regretIndex = -1;
        displayText = 'SLACKER';
      }
    }
    
    // Essential logging: data, logic, output
    console.log(`👤 ${item.username}: ${item.regret_index} (${item.checklist_created_at}) → ${isToday ? 'TODAY' : 'NOT TODAY'} → ${displayText}`);
    
    const color = getRegretIndexColor(regretIndex);
    const style: TextStyle = regretIndex === -1 ? { fontWeight: 'bold' } : {};
    
    return (
      <View style={[styles.networkUserItem, { borderBottomColor: themeColors.border }]}>
        <View style={styles.networkUserInfo}>
          <Image 
            source={require('../assets/user_1.png')}
            style={[styles.networkUserIcon, { tintColor: themeColors.primary }]}
            resizeMode="contain"
          />
          <View style={styles.networkUserDetails}>
            <Text style={[styles.networkUsername, { color: themeColors.text }]}>
              {item.username}
            </Text>
          </View>
        </View>
        <View style={styles.networkUserActions}>
          <Text style={[styles.networkUserRegretIndex, { color }, style]}>
            {displayText}
          </Text>
          <TouchableOpacity
            style={[styles.unfollowButton, { borderColor: themeColors.border }]}
            onPress={() => handleUnfollowUser(item.id, item.username)}
          >
            <Text style={[styles.unfollowButtonText, { color: themeColors.textSecondary }]}>
              Unfollow
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.primary }]}>Network</Text>
      </View>

      <View style={[styles.userInfo, { borderBottomColor: themeColors.border }]}>
        <View style={styles.usernameContainer}>
          <Image 
            source={require('../assets/user_1.png')}
            style={[styles.userIcon, { tintColor: themeColors.primary }]}
            resizeMode="contain"
          />
          <Text style={[styles.username, { color: themeColors.text }]}>{username}</Text>
          <Text style={[styles.regretIndex, { color }, style]}>
            {text}
          </Text>
        </View>
      </View>

      <View style={styles.addNetworkSection}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: themeColors.primary }]}
          onPress={handleAddToNetwork}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>Add to my Network</Text>
        </TouchableOpacity>
      </View>

      {/* Network Users List */}
      {isLoadingNetwork ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Loading network...
          </Text>
        </View>
      ) : networkUsers.length > 0 ? (
        <View style={styles.networkListContainer}>
          <Text style={[styles.networkListTitle, { color: themeColors.text }]}>
            Your Network ({networkUsers.length})
          </Text>
          <FlatList
            data={networkUsers}
            renderItem={renderNetworkUser}
            keyExtractor={(item) => item.id.toString()}
            style={styles.networkList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: themeColors.textSecondary }]}>
            No users in your network yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: themeColors.textSecondary }]}>
            Use the button above to add users to your network
          </Text>
        </View>
      )}

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Add to Network
            </Text>
            
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              Enter the username of the person you want to follow
            </Text>
            
            <TextInput
              style={[styles.usernameInput, { 
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.text
              }]}
              placeholder="Enter username"
              placeholderTextColor={themeColors.textSecondary}
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: themeColors.border }]}
                onPress={handleCloseModal}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButtonModal, { backgroundColor: themeColors.primary }]}
                onPress={handleAddUser}
                disabled={isLoading || !newUsername.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.addButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    textAlign: 'center',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  regretIndex: {
    fontSize: 18,
    marginLeft: 10,
    textAlign: 'center',
  },
  addNetworkSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  usernameInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonModal: {
    // This style is for the modal's add button, not the main add button
    // It's not directly used in the main add button, but for consistency
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  networkListContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  networkListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  networkList: {
    // No specific styles needed for FlatList, it handles its own layout
  },
  networkUserItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  networkUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkUserIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  networkUserDetails: {
    marginLeft: 10,
  },
  networkUsername: {
    fontSize: 16,
    fontWeight: '500',
  },
  networkUserActions: {
    alignItems: 'flex-end',
  },
  networkUserRegretIndex: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  unfollowButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  unfollowButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 