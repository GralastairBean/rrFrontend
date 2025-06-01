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