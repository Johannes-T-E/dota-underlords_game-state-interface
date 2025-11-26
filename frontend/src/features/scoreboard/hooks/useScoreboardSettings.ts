import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  updateScoreboardColumns,
  updateScoreboardSort,
  resetScoreboardSettings,
  selectScoreboardSettings
} from '@/store/settingsSlice';
import type { ScoreboardColumnConfig } from '@/types';

/**
 * Hook for managing Scoreboard settings for a specific widget
 * @param widgetId - Unique identifier for the widget instance (e.g., "scoreboard-1")
 */
export const useScoreboardSettings = (widgetId: string) => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectScoreboardSettings(widgetId));

  const updateColumns = useCallback(
    (columns: Partial<ScoreboardColumnConfig>) => {
      dispatch(updateScoreboardColumns({ widgetId, columns }));
    },
    [dispatch, widgetId]
  );

  const updateSort = useCallback(
    (sortConfig: { field?: 'health' | 'record' | 'networth'; direction?: 'asc' | 'desc' }) => {
      dispatch(updateScoreboardSort({ widgetId, ...sortConfig }));
    },
    [dispatch, widgetId]
  );

  const resetSettings = useCallback(() => {
    dispatch(resetScoreboardSettings(widgetId));
  }, [dispatch, widgetId]);

  return {
    settings,
    updateColumns,
    updateSort,
    resetSettings
  };
};

