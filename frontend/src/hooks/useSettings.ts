import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  updateHealthSettings,
  resetHealthSettings,
  updateGeneralSettings,
  updateHeroPortraitSettings,
  updateTierGlowConfig,
  resetHeroPortraitSettings,
  updateUnitAnimationSettings,
  resetUnitAnimationSettings,
  resetAllSettings,
  importSettings,
  selectHealthSettings,
  selectGeneralSettings,
  selectHeroPortraitSettings,
  selectUnitAnimationSettings
} from '@/store/settingsSlice';
import type { HealthDisplaySettings } from '@/components/ui/HealthDisplay/HealthDisplaySettings';
import type { HeroPortraitSettings, TierGlowConfig, UnitAnimationSettings } from '@/store/settingsSlice';

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

// useScoreboardSettings moved to features/scoreboard/hooks/useScoreboardSettings.ts
// Import from '@/features/scoreboard/hooks/useScoreboardSettings' instead

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

