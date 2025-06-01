import { api } from '../config';
import { ApiResponse, Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

export const taskService = {
  // Get all tasks
  getAllTasks: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get<ApiResponse<Task[]>>('/tasks');
    return response.data;
  },

  // Get a single task by ID
  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  createTask: async (task: CreateTaskRequest): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>('/tasks', task);
    return response.data;
  },

  // Update a task
  updateTask: async (id: string, task: UpdateTaskRequest): Promise<ApiResponse<Task>> => {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, task);
    return response.data;
  },

  // Delete a task
  deleteTask: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/tasks/${id}`);
    return response.data;
  },
}; 