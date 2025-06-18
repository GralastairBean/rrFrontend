import { api } from '../config';
import { Checklist, Regret, CreateRegretRequest, CreateChecklistRequest, UpdateRegretRequest } from '../types';

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
  // Use this for retrieving multiple checklists (e.g., history, filtered views)
  // Example: checklistService.getChecklists({ created_at_after: '2024-01-01' })
  getChecklists: async (params?: ChecklistQueryParams): Promise<Checklist[]> => {
    const response = await api.get<Checklist[]>('/api/checklists/', {
      params
    });
    return response.data;
  },

  // Create or get today's checklist using POST request
  // Use this for getting today's checklist - will create one if it doesn't exist
  // Example: checklistService.createOrGetTodayChecklist('2025-06-19T01:00:00+08:00')
  createOrGetTodayChecklist: async (localDatetime: string): Promise<Checklist> => {
    const response = await api.post<Checklist>('/api/checklists/', {
      local_datetime: localDatetime
    });
    return response.data;
  },

  // Get today's checklist (convenience method)
  // Legacy method - consider using createOrGetTodayChecklist instead
  getTodayChecklist: async (): Promise<Checklist[]> => {
    return checklistService.getChecklists({ today: true });
  },

  // Get regrets for a checklist
  getChecklistRegrets: async (checklistId: number): Promise<Regret[]> => {
    const response = await api.get<Regret[]>(`/api/checklists/${checklistId}/regrets/`);
    return response.data;
  },

  // Create a new regret for a checklist
  createRegret: async (checklistId: number, regret: CreateRegretRequest): Promise<Regret> => {
    const response = await api.post<Regret>(`/api/checklists/${checklistId}/regrets/`, regret);
    return response.data;
  },

  // Update a regret
  updateRegret: async (checklistId: number, regretId: number, regret: UpdateRegretRequest): Promise<Regret> => {
    const response = await api.patch<Regret>(`/api/checklists/${checklistId}/regrets/${regretId}/`, regret);
    return response.data;
  }
}; 