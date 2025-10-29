import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  updateHealthSettings,
  resetHealthSettings,
  updateScoreboardColumns,
  updateScoreboardSort,
  resetScoreboardSettings,
  updateGeneralSettings,
  updateHeroPortraitSettings,
  updateTierGlowConfig,
  resetHeroPortraitSettings,
  updateUnitAnimationSettings,
  resetUnitAnimationSettings,
  resetAllSettings,
  importSettings,
  selectHealthSettings,
  selectScoreboardSettings,
  selectGeneralSettings,
  selectHeroPortraitSettings,
  selectUnitAnimationSettings
} from '../store/settingsSlice';
import type { HealthDisplaySettings } from '../components/molecules/HealthDisplay/HealthDisplaySettings';
import type { ScoreboardColumnConfig } from '../types';
import type { HeroPortraitSettings, TierGlowConfig, UnitAnimationSettings } from '../store/settingsSlice';

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
 * Hook for managing Hero Portrait settings
 */
export const useHeroPortraitSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectHeroPortraitSettings);

  const updateSettings = useCallback(
    (newSettings: Partial<HeroPortraitSettings>) => {
      dispatch(updateHeroPortraitSettings(newSettings));
    },
    [dispatch]
  );

  const updateTierGlowConfigSettings = useCallback(
    (newConfig: Partial<TierGlowConfig>) => {
      dispatch(updateTierGlowConfig(newConfig));
    },
    [dispatch]
  );

  const resetSettings = useCallback(() => {
    dispatch(resetHeroPortraitSettings());
  }, [dispatch]);

  return {
    settings,
    updateSettings,
    updateTierGlowConfig: updateTierGlowConfigSettings,
    resetSettings
  };
};

/**
 * Hook for managing Unit Animation settings
 */
export const useUnitAnimationSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectUnitAnimationSettings);

  const updateSettings = useCallback(
    (newSettings: Partial<UnitAnimationSettings>) => {
      dispatch(updateUnitAnimationSettings(newSettings));
    },
    [dispatch]
  );

  const resetSettings = useCallback(() => {
    dispatch(resetUnitAnimationSettings());
  }, [dispatch]);

  return {
    settings,
    updateSettings,
    resetSettings
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

