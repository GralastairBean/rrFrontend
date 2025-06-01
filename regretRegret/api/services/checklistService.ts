import { api } from '../config';
import { ApiResponse, Checklist, Regret, CreateRegretRequest } from '../types';

export interface ChecklistQueryParams {
  completed?: boolean;
  created_at_after?: string;
  created_at_before?: string;
  score_max?: string;
  score_min?: string;
  today?: boolean;
}

export const checklistService = {
  // Get checklists with optional filters
  getChecklists: async (params?: ChecklistQueryParams): Promise<ApiResponse<Checklist[]>> => {
    const response = await api.get<ApiResponse<Checklist[]>>('/api/checklists/', {
      params
    });
    return response.data;
  },

  // Get today's checklist (convenience method)
  getTodayChecklist: async (): Promise<ApiResponse<Checklist[]>> => {
    return checklistService.getChecklists({ today: true });
  },

  // Get regrets for a checklist
  getChecklistRegrets: async (checklistId: number): Promise<ApiResponse<Regret[]>> => {
    const response = await api.get<ApiResponse<Regret[]>>(`/api/checklists/${checklistId}/regrets/`);
    return response.data;
  },

  // Create a new regret for a checklist
  createRegret: async (checklistId: number, regret: CreateRegretRequest): Promise<ApiResponse<Regret>> => {
    const response = await api.post<ApiResponse<Regret>>(`/api/checklists/${checklistId}/regrets/`, regret);
    return response.data;
  },

  // Update a regret
  updateRegret: async (checklistId: number, regretId: number, regret: Partial<Regret>): Promise<ApiResponse<Regret>> => {
    const response = await api.patch<ApiResponse<Regret>>(`/api/checklists/${checklistId}/regrets/${regretId}/`, regret);
    return response.data;
  }
}; 