import { api } from '../config';

export interface NetworkUser {
  id: number;
  username: string;
  regret_index: number; // Backend uses 'regret_index', not 'current_regret_index'
  followed_at?: string; // This might also be missing, using date_joined instead
  date_joined: string; // Backend provides this field
  checklist_created_at?: string; // UTC date when checklist was created
  allow_networking: boolean; // Whether this user allows networking
}

export interface UsernameValidationResponse {
  user_id: number;
  username: string;
  allow_networking: boolean;
}

export interface FollowUserResponse {
  following: string;
  message: string;
  network_id: number;
}

export interface NetworkListResponse {
  count: number;
  list_type: string;
  users: NetworkUser[];
}

export const networkService = {
  // Validate username for networking
  validateUsernameForNetwork: async (username: string): Promise<UsernameValidationResponse> => {
    console.log('🔍 Calling validate endpoint:', `/api/network/validate/${username}/`);
    const response = await api.get<UsernameValidationResponse>(`/api/network/validate/${username}/`);
    console.log('📋 Validate response:', response.data);
    return response.data;
  },

  // Follow a user
  followUser: async (targetUsername: string): Promise<FollowUserResponse> => {
    console.log('👥 Calling follow endpoint:', `/api/network/follow/${targetUsername}/`);
    const response = await api.post<FollowUserResponse>(`/api/network/follow/${targetUsername}/`);
    console.log('✅ Follow response:', response.data);
    return response.data;
  },

  // Get list of users you're following
  getFollowingUsers: async (): Promise<NetworkUser[]> => {
    console.log('📋 Calling following list endpoint:', '/api/network/list/following/');
    const response = await api.get<NetworkListResponse>('/api/network/list/following/');
    console.log('📋 Following list response:', response.data);
    return response.data.users; // Extract users array from response
  },

  // Unfollow a user
  unfollowUser: async (username: string): Promise<{ success: boolean; message: string }> => {
    console.log('🚫 Calling unfollow endpoint:', `/api/network/unfollow/${username}/`);
    const response = await api.delete<{ success: boolean; message: string }>(`/api/network/unfollow/${username}/`);
    console.log('✅ Unfollow response:', response.data);
    return response.data;
  },

  // Update networking settings
  updateNetworkingSettings: async (allowNetworking: boolean): Promise<{ allow_networking: boolean; message: string }> => {
    console.log('⚙️ Calling networking settings endpoint:', '/api/network/settings/');
    const response = await api.patch<{ allow_networking: boolean; message: string }>('/api/network/settings/', {
      allow_networking: allowNetworking
    });
    console.log('✅ Networking settings response:', response.data);
    return response.data;
  },

  // Get current networking settings
  getNetworkingSettings: async (): Promise<{ allow_networking: boolean; message: string }> => {
    console.log('⚙️ Getting current networking settings');
    const response = await api.get<{ allow_networking: boolean; message: string }>('/api/network/settings/');
    console.log('✅ Current networking settings:', response.data);
    return response.data;
  }
}; 