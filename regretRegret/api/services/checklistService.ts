import { api } from '../config';
import { Checklist, Regret, CreateRegretRequest } from '../types';

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
  getChecklists: async (params?: ChecklistQueryParams): Promise<Checklist[]> => {
    const response = await api.get<Checklist[]>('/api/checklists/', {
      params
    });
    return response.data;
  },

  // Get today's checklist (convenience method)
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
  updateRegret: async (checklistId: number, regretId: number, regret: Partial<Regret>): Promise<Regret> => {
    const response = await api.patch<Regret>(`/api/checklists/${checklistId}/regrets/${regretId}/`, regret);
    return response.data;
  }
}; 