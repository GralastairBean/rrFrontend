// Generic API response type
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// Generic error response
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Authentication types
export interface TokenObtainPairRequest {
  email: string;
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

// Example of a specific API model (modify based on your actual API)
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Example request types (modify based on your actual API)
export interface CreateTaskRequest {
  text: string;
}

export interface UpdateTaskRequest {
  text?: string;
  completed?: boolean;
} 