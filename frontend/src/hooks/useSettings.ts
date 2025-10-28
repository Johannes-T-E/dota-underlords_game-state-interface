import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  updateHealthSettings,
  resetHealthSettings,
  updateScoreboardColumns,
  updateScoreboardSort,
  resetScoreboardSettings,
  updateGeneralSettings,
  resetAllSettings,
  importSettings,
  selectHealthSettings,
  selectScoreboardSettings,
  selectGeneralSettings
} from '../store/settingsSlice';
import type { HealthDisplaySettings } from '../components/molecules/HealthDisplay/HealthDisplaySettings';
import type { ScoreboardColumnConfig } from '../types';

/**
 * Hook for managing Health Display settings
 */
export const useHealthSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectHealthSettings);

  const updateSettings = useCallback(
    (newSettings: Partial<HealthDisplaySettings>) => {
      dispatch(updateHealthSettings(newSettings));
    },
    [dispatch]
  );

  const resetSettings = useCallback(() => {
    dispatch(resetHealthSettings());
  }, [dispatch]);

  return {
    settings,
    updateSettings,
    resetSettings
  };
};

/**
 * Hook for managing Scoreboard settings
 */
export const useScoreboardSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectScoreboardSettings);

  const updateColumns = useCallback(
    (columns: Partial<ScoreboardColumnConfig>) => {
      dispatch(updateScoreboardColumns(columns));
    },
    [dispatch]
  );

  const updateSort = useCallback(
    (sortConfig: { field?: 'health' | 'record' | 'networth'; direction?: 'asc' | 'desc' }) => {
      dispatch(updateScoreboardSort(sortConfig));
    },
    [dispatch]
  );

  const resetSettings = useCallback(() => {
    dispatch(resetScoreboardSettings());
  }, [dispatch]);

  return {
    settings,
    updateColumns,
    updateSort,
    resetSettings
  };
};

/**
 * Hook for managing general app settings
 */
export const useGeneralSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectGeneralSettings);

  const updateSettings = useCallback(
    (newSettings: { theme?: string }) => {
      dispatch(updateGeneralSettings(newSettings));
    },
    [dispatch]
  );

  return {
    settings,
    updateSettings
  };
};

/**
 * Hook for global settings operations
 */
export const useGlobalSettings = () => {
  const dispatch = useAppDispatch();
  const allSettings = useAppSelector((state) => state.settings);

  const resetAll = useCallback(() => {
    dispatch(resetAllSettings());
  }, [dispatch]);

  const exportSettings = useCallback(() => {
    return JSON.stringify(allSettings, null, 2);
  }, [allSettings]);

  const importSettingsFromJson = useCallback(
    (json: string) => {
      dispatch(importSettings(json));
    },
    [dispatch]
  );

  return {
    resetAll,
    exportSettings,
    importSettings: importSettingsFromJson
  };
};

