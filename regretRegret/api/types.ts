// Generic API response type
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Auth types
export interface TokenObtainPairRequest {
  username: string;
  password: string;
}

export interface TokenObtainPairResponse {
  access: string;
  refresh: string;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
}

export interface User {
  id: number;
  username: string;
  is_active: boolean;
  tokens: TokenObtainPairResponse;  // This is an object containing access and refresh tokens
}

export interface UserRegistrationRequest {
  username: string;
  password: string;
}

// Checklist types
export interface Checklist {
  id: number;
  created_at: string;
  score: string;
  completed: boolean;
  user: number;
}

// Regret types
export interface Regret {
  id: number;
  description: string;
  created_at: string;
  success: boolean;
}

export interface CreateRegretRequest {
  description: string;
}

export interface PatchedRegret {
  description?: string;
  success?: boolean;
}

// Task types (for legacy support)
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  text: string;
}

export interface UpdateTaskRequest {
  text?: string;
  completed?: boolean;
} 