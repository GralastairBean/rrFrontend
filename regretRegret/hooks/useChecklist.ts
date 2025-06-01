import { useState, useCallback, useEffect } from 'react';
import { checklistService, ChecklistQueryParams } from '../api/services/checklistService';
import { Checklist, Regret, CreateRegretRequest } from '../api/types';

export const useChecklist = (initialParams?: ChecklistQueryParams) => {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [regrets, setRegrets] = useState<Regret[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<ChecklistQueryParams | undefined>(initialParams);

  // Fetch checklists with optional filters
  const fetchChecklists = useCallback(async (params?: ChecklistQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await checklistService.getChecklists(params);
      const firstChecklist = response.data[0]; // Get the first checklist
      
      if (firstChecklist) {
        setChecklist(firstChecklist);
        
        // Get regrets for this checklist
        const regretsResponse = await checklistService.getChecklistRegrets(firstChecklist.id);
        setRegrets(regretsResponse.data);
      } else {
        setError('No checklist found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch checklist');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update query parameters and fetch checklists
  const updateFilters = useCallback((newParams: ChecklistQueryParams) => {
    setQueryParams(newParams);
    fetchChecklists(newParams);
  }, [fetchChecklists]);

  // Create a new regret
  const createRegret = useCallback(async (description: string) => {
    if (!checklist) {
      setError('No active checklist');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const newRegret: CreateRegretRequest = {
        description
      };
      
      const response = await checklistService.createRegret(checklist.id, newRegret);
      setRegrets(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create regret');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checklist]);

  // Toggle regret success status
  const toggleRegretSuccess = useCallback(async (regretId: number) => {
    if (!checklist) {
      setError('No active checklist');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const regret = regrets.find(r => r.id === regretId);
      if (!regret) {
        throw new Error('Regret not found');
      }
      
      const response = await checklistService.updateRegret(checklist.id, regretId, {
        success: !regret.success
      });
      
      setRegrets(prev => prev.map(r => 
        r.id === regretId ? response.data : r
      ));
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update regret');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checklist, regrets]);

  // Fetch checklist on mount and when query params change
  useEffect(() => {
    fetchChecklists(queryParams);
  }, [fetchChecklists, queryParams]);

  return {
    checklist,
    regrets,
    loading,
    error,
    createRegret,
    toggleRegretSuccess,
    updateFilters,
    refreshChecklist: () => fetchChecklists(queryParams)
  };
}; 