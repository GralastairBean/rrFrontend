import { useState, useCallback, useEffect, useRef } from 'react';
import { checklistService, ChecklistQueryParams } from '../api/services/checklistService';
import { Checklist, Regret, CreateRegretRequest } from '../api/types';
import { getLocalDateTimeWithTimezone } from '../utils/datetime';

export const useChecklist = (initialParams?: ChecklistQueryParams) => {
  const [state, setState] = useState<{
    checklist: Checklist | null;
    regrets: Regret[];
    loading: boolean;
    error: string | null;
  }>({
    checklist: null,
    regrets: [],
    loading: true,
    error: null
  });
  const [queryParams, setQueryParams] = useState<ChecklistQueryParams | undefined>(initialParams);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch checklists with optional filters
  const fetchChecklists = useCallback(async (params?: ChecklistQueryParams) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const checklists = await checklistService.getChecklists(params);
      const firstChecklist = checklists[0];
      
      if (firstChecklist) {
        const checklistRegrets = await checklistService.getChecklistRegrets(firstChecklist.id);
        
        if (isMounted.current) {
          setState({
            checklist: firstChecklist,
            regrets: checklistRegrets,
            loading: false,
            error: null
          });
        }
      } else {
        if (isMounted.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'No checklist found'
          }));
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch checklist'
        }));
      }
    }
  }, []);

  // Get or create today's checklist using POST request
  const getTodayChecklist = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get current local datetime with timezone
      const localDatetime = getLocalDateTimeWithTimezone();
      
      const checklist = await checklistService.createOrGetTodayChecklist(localDatetime);
      const checklistRegrets = await checklistService.getChecklistRegrets(checklist.id);
      
      if (isMounted.current) {
        setState({
          checklist: checklist,
          regrets: checklistRegrets,
          loading: false,
          error: null
        });
      }
    } catch (err) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to get today\'s checklist'
        }));
      }
    }
  }, []);

  // Update query parameters and fetch checklists
  const updateFilters = useCallback((newParams: ChecklistQueryParams) => {
    setQueryParams(newParams);
    fetchChecklists(newParams);
  }, [fetchChecklists]);

  // Create a new regret
  const createRegret = useCallback(async (description: string) => {
    if (!state.checklist) {
      setState(prev => ({ ...prev, error: 'No active checklist' }));
      return;
    }

    try {
      // Optimistically add the regret with a temporary ID
      const tempRegret: Regret = {
        id: Date.now(), // temporary ID
        description,
        created_at: new Date().toISOString(),
        success: false
      };
      
      setState(prev => ({
        ...prev,
        regrets: [...prev.regrets, tempRegret],
        error: null
      }));
      
      // Get current local datetime with timezone for the creation
      const localDatetime = getLocalDateTimeWithTimezone();
      
      const createdRegret = await checklistService.createRegret(state.checklist.id, {
        description,
        local_datetime: localDatetime
      });
      
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          regrets: prev.regrets.map(r => 
            r.id === tempRegret.id ? createdRegret : r
          )
        }));
      }
      
      return createdRegret;
    } catch (err) {
      // Remove the optimistically added regret on error
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          regrets: prev.regrets.filter(r => r.id !== Date.now()),
          error: err instanceof Error ? err.message : 'Failed to create regret'
        }));
      }
      throw err;
    }
  }, [state.checklist]);

  // Toggle regret success status
  const toggleRegretSuccess = useCallback(async (regretId: number) => {
    if (!state.checklist) {
      setState(prev => ({ ...prev, error: 'No active checklist' }));
      return;
    }

    try {
      const regret = state.regrets.find(r => r.id === regretId);
      if (!regret) {
        throw new Error('Regret not found');
      }

      // Optimistically update the UI
      setState(prev => ({
        ...prev,
        regrets: prev.regrets.map(r =>
          r.id === regretId ? { ...r, success: !r.success } : r
        )
      }));
      
      // Get current local datetime with timezone for the update
      const localDatetime = getLocalDateTimeWithTimezone();
      
      const updatedRegret = await checklistService.updateRegret(state.checklist.id, regretId, {
        success: !regret.success,
        local_datetime: localDatetime
      });
      
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          regrets: prev.regrets.map(r =>
            r.id === regretId ? updatedRegret : r
          )
        }));
      }
      
      return updatedRegret;
    } catch (err) {
      // Revert the optimistic update on error
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to update regret'
        }));
      }
      throw err;
    }
  }, [state.checklist, state.regrets]);

  // Fetch checklist on mount and when query params change
  useEffect(() => {
    fetchChecklists(queryParams);
  }, [fetchChecklists, queryParams]);

  return {
    checklist: state.checklist,
    regrets: state.regrets,
    loading: state.loading,
    error: state.error,
    createRegret,
    toggleRegretSuccess,
    updateFilters,
    refreshChecklist: () => fetchChecklists(queryParams),
    getTodayChecklist
  };
}; 