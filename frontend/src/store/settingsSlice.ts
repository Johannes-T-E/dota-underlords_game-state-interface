import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HealthDisplaySettings } from '@/components/ui/HealthDisplay/HealthDisplaySettings';
import type { ScoreboardColumnConfig } from '@/types';
import { DEFAULT_HEALTH_DISPLAY_SETTINGS } from '@/components/ui/HealthDisplay/HealthDisplaySettings';

const SETTINGS_VERSION = 2;

export interface ScoreboardSettings {
  columns: ScoreboardColumnConfig;
  sortField: 'health' | 'record' | 'networth';
  sortDirection: 'asc' | 'desc';
}

export interface TierGlowConfig {
  enableBorder: boolean;
  enableDropShadow: boolean;
  borderOpacity: number;
  dropShadowOpacity: number;
}

export interface HeroPortraitSettings {
  enableTierGlow: boolean;
  tierGlowConfig: TierGlowConfig;
}

export interface UnitAnimationSettings {
  enablePositionAnimation: boolean;
  animationDuration: number;
  enableNewUnitFade: boolean;
  enableMovementTrail: boolean;
  trailLength: number;
  trailColor: string;
  trailOpacity: number;
  trailThickness: number;
  useTierColor: boolean;
}

export interface GeneralSettings {
  theme?: string;
  heroPortrait: HeroPortraitSettings;
  unitAnimation: UnitAnimationSettings;
  showSynergyPips: boolean;
}

export interface SettingsState {
  version: number;
  health: HealthDisplaySettings;
  scoreboards: Record<string, ScoreboardSettings>;
  general: GeneralSettings;
}

const defaultScoreboardSettings: ScoreboardSettings = {
  columns: {
    place: true,
    player: false,
    playerName: true,
    level: true,
    gold: true,
    streak: true,
    health: true,
    record: true,
    networth: true,
    roster: true,
    underlord: true,
    contraptions: true,
    bench: true,
    synergies: true,
    columnOrder: ['place', 'playerName', 'level', 'gold', 'streak', 'health', 'record', 'networth', 'synergies', 'roster', 'underlord', 'contraptions', 'bench']
  },
  sortField: 'health',
  sortDirection: 'desc'
};

const defaultTierGlowConfig: TierGlowConfig = {
  enableBorder: true,
  enableDropShadow: true,
  borderOpacity: 1.0,
  dropShadowOpacity: 0.8
};

const defaultHeroPortraitSettings: HeroPortraitSettings = {
  enableTierGlow: false,
  tierGlowConfig: defaultTierGlowConfig
};

const defaultUnitAnimationSettings: UnitAnimationSettings = {
  enablePositionAnimation: true,
  animationDuration: 300,
  enableNewUnitFade: true,
  enableMovementTrail: true,
  trailLength: 3,
  trailColor: '#ffffff',
  trailOpacity: 0.6,
  trailThickness: 2,
  useTierColor: false
};

const initialState: SettingsState = {
  version: SETTINGS_VERSION,
  health: DEFAULT_HEALTH_DISPLAY_SETTINGS,
  scoreboards: {},
  general: {
    heroPortrait: defaultHeroPortraitSettings,
    unitAnimation: defaultUnitAnimationSettings,
    showSynergyPips: false
  }
};

// Validate and ensure settings have required structure
const validateSettings = (settings: unknown): SettingsState => {
  if (!settings || typeof settings !== 'object') {
    return initialState;
  }
  
  const s = settings as Partial<SettingsState>;
  
  // If version doesn't match, reset to defaults (no migration)
  if (s.version !== SETTINGS_VERSION) {
    return initialState;
  }
  
  return {
    version: SETTINGS_VERSION,
    health: s.health ?? DEFAULT_HEALTH_DISPLAY_SETTINGS,
    scoreboards: s.scoreboards ?? {},
    general: {
      theme: s.general?.theme,
      heroPortrait: s.general?.heroPortrait ?? defaultHeroPortraitSettings,
      unitAnimation: s.general?.unitAnimation ?? defaultUnitAnimationSettings,
      showSynergyPips: s.general?.showSynergyPips ?? false
    }
  };
};

// Load settings from localStorage
const loadPersistedSettings = (): SettingsState => {
  try {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return validateSettings(parsed);
    }
  } catch (error) {
    console.warn('Failed to load persisted settings:', error);
  }
  return initialState;
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: loadPersistedSettings(),
  reducers: {
    updateHealthSettings: (state, action: PayloadAction<Partial<HealthDisplaySettings>>) => {
      state.health = {
        ...state.health,
        ...action.payload,
        styling: {
          ...state.health.styling,
          ...action.payload.styling
        },
        colorConfig: action.payload.colorConfig ?? state.health.colorConfig
      };
    },

    resetHealthSettings: (state) => {
      state.health = DEFAULT_HEALTH_DISPLAY_SETTINGS;
    },

    updateScoreboardColumns: (state, action: PayloadAction<{ widgetId: string; columns: Partial<ScoreboardColumnConfig> }>) => {
      const { widgetId, columns } = action.payload;
      if (!state.scoreboards[widgetId]) {
        state.scoreboards[widgetId] = { ...defaultScoreboardSettings };
      }
      state.scoreboards[widgetId].columns = {
        ...state.scoreboards[widgetId].columns,
        ...columns
      };
    },

    updateScoreboardSort: (state, action: PayloadAction<{ widgetId: string; field?: 'health' | 'record' | 'networth'; direction?: 'asc' | 'desc' }>) => {
      const { widgetId, field, direction } = action.payload;
      if (!state.scoreboards[widgetId]) {
        state.scoreboards[widgetId] = { ...defaultScoreboardSettings };
      }
      if (field) {
        state.scoreboards[widgetId].sortField = field;
      }
      if (direction) {
        state.scoreboards[widgetId].sortDirection = direction;
      }
    },

    resetScoreboardSettings: (state, action: PayloadAction<string | undefined>) => {
      const widgetId = action.payload;
      if (widgetId) {
        state.scoreboards[widgetId] = { ...defaultScoreboardSettings };
      } else {
        state.scoreboards = {};
      }
    },

    updateGeneralSettings: (state, action: PayloadAction<Partial<GeneralSettings>>) => {
      state.general = {
        ...state.general,
        ...action.payload
      };
    },

    updateHeroPortraitSettings: (state, action: PayloadAction<Partial<HeroPortraitSettings>>) => {
      state.general.heroPortrait = {
        ...state.general.heroPortrait,
        ...action.payload
      };
    },

    updateTierGlowConfig: (state, action: PayloadAction<Partial<TierGlowConfig>>) => {
      state.general.heroPortrait.tierGlowConfig = {
        ...state.general.heroPortrait.tierGlowConfig,
        ...action.payload
      };
    },

    resetHeroPortraitSettings: (state) => {
      state.general.heroPortrait = defaultHeroPortraitSettings;
    },

    updateUnitAnimationSettings: (state, action: PayloadAction<Partial<UnitAnimationSettings>>) => {
      state.general.unitAnimation = {
        ...state.general.unitAnimation,
        ...action.payload
      };
    },

    resetUnitAnimationSettings: (state) => {
      state.general.unitAnimation = defaultUnitAnimationSettings;
    },

    updateShowSynergyPips: (state, action: PayloadAction<boolean>) => {
      state.general.showSynergyPips = action.payload;
    },

    resetAllSettings: (state) => {
      state.health = DEFAULT_HEALTH_DISPLAY_SETTINGS;
      state.scoreboards = {};
      state.general = {
        heroPortrait: defaultHeroPortraitSettings,
        unitAnimation: defaultUnitAnimationSettings,
        showSynergyPips: false
      };
      state.version = SETTINGS_VERSION;
    },

    loadSettings: (state, action: PayloadAction<SettingsState>) => {
      const validated = validateSettings(action.payload);
      state.health = validated.health;
      state.scoreboards = validated.scoreboards;
      state.general = validated.general;
      state.version = validated.version;
    },

    importSettings: (state, action: PayloadAction<string>) => {
      try {
        const parsed = JSON.parse(action.payload);
        const validated = validateSettings(parsed);
        state.health = validated.health;
        state.scoreboards = validated.scoreboards;
        state.general = validated.general;
        state.version = validated.version;
      } catch (error) {
        console.error('Failed to import settings:', error);
      }
    }
  }
});

export const {
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
  updateShowSynergyPips,
  resetAllSettings,
  loadSettings,
  importSettings
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
export const selectHealthSettings = (state: { settings: SettingsState }) => state.settings.health;
export const selectScoreboardSettings = (widgetId: string) => (state: { settings: SettingsState }): ScoreboardSettings => {
  if (!state.settings.scoreboards[widgetId]) {
    return defaultScoreboardSettings;
  }
  return state.settings.scoreboards[widgetId];
};
export const selectGeneralSettings = (state: { settings: SettingsState }) => state.settings.general;
export const selectHeroPortraitSettings = (state: { settings: SettingsState }) => state.settings.general.heroPortrait;
export const selectUnitAnimationSettings = (state: { settings: SettingsState }) => state.settings.general.unitAnimation;
export const selectShowSynergyPips = (state: { settings: SettingsState }) => state.settings.general.showSynergyPips;
