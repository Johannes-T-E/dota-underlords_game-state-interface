import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HealthDisplaySettings } from '@/components/ui/HealthDisplay/HealthDisplaySettings';
import type { ScoreboardColumnConfig } from '@/types';
import { DEFAULT_HEALTH_DISPLAY_SETTINGS } from '@/components/ui/HealthDisplay/HealthDisplaySettings';

// Current settings version for migration purposes
const SETTINGS_VERSION = 1;

export interface ScoreboardSettings {
  columns: ScoreboardColumnConfig;
  sortField: 'health' | 'record' | 'networth';
  sortDirection: 'asc' | 'desc';
}

export interface TierGlowConfig {
  enableBorder: boolean;
  enableDropShadow: boolean;
  borderOpacity: number; // 0-1
  dropShadowOpacity: number; // 0-1
}

export interface HeroPortraitSettings {
  enableTierGlow: boolean;
  tierGlowConfig: TierGlowConfig;
}

export interface UnitAnimationSettings {
  enablePositionAnimation: boolean;
  animationDuration: number; // in ms
  enableNewUnitFade: boolean;
  enableMovementTrail: boolean;
  trailLength: number;
  trailColor: string; // Trail color (hex or rgba)
  trailOpacity: number; // Trail opacity (0-1)
  trailThickness: number; // Trail line thickness (1-5)
  useTierColor: boolean; // Use hero tier color for trail
}

export interface GeneralSettings {
  theme?: string;
  heroPortrait: HeroPortraitSettings;
  unitAnimation: UnitAnimationSettings;
}

export interface SettingsState {
  version: number;
  health: HealthDisplaySettings;
  scoreboards: Record<string, ScoreboardSettings>; // Map of widgetId -> settings
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
    columnOrder: ['place', 'playerName', 'level', 'gold', 'streak', 'health', 'record', 'networth', 'roster', 'underlord', 'contraptions', 'bench']
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
  scoreboards: {}, // Per-widget settings, initialized on first access
  general: {
    heroPortrait: defaultHeroPortraitSettings,
    unitAnimation: defaultUnitAnimationSettings
  }
};

// Migration function for settings versions
const migrateSettings = (settings: any): SettingsState => {
  if (!settings || !settings.version) {
    // No version or invalid data, return defaults
    return initialState;
  }

  // Handle future migrations here
  if (settings.version < SETTINGS_VERSION) {
    // Perform migrations based on version
    // Migration: Convert old single scoreboard to per-widget structure
    if (settings.scoreboard && !settings.scoreboards) {
      // Old format - convert to new format (but we're wiping per user request)
      settings.scoreboards = {};
    }
    
    settings.version = SETTINGS_VERSION;
  }

  // Ensure scoreboards exists (new structure)
  if (!settings.scoreboards) {
    settings.scoreboards = {};
  }

  // Ensure heroPortrait settings exist
  if (!settings.general) {
    settings.general = {};
  }
  if (!settings.general.heroPortrait) {
    settings.general.heroPortrait = defaultHeroPortraitSettings;
  } else {
    // Migrate existing heroPortrait settings to new structure
    if (settings.general.heroPortrait.enableTierGlow !== undefined && !settings.general.heroPortrait.tierGlowConfig) {
      settings.general.heroPortrait.tierGlowConfig = defaultTierGlowConfig;
    }
  }

  // Ensure unitAnimation settings exist
  if (!settings.general.unitAnimation) {
    settings.general.unitAnimation = defaultUnitAnimationSettings;
  }

  return settings;
};

// Load settings from localStorage
const loadPersistedSettings = (): SettingsState => {
  try {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return migrateSettings(parsed);
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
    // Health Display Settings
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

    // Scoreboard Settings (per-widget)
    updateScoreboardColumns: (state, action: PayloadAction<{ widgetId: string; columns: Partial<ScoreboardColumnConfig> }>) => {
      const { widgetId, columns } = action.payload;
      // Initialize widget settings if they don't exist
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
      // Initialize widget settings if they don't exist
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
        // Reset specific widget
        state.scoreboards[widgetId] = { ...defaultScoreboardSettings };
      } else {
        // Reset all widgets
        state.scoreboards = {};
      }
    },

    // General Settings
    updateGeneralSettings: (state, action: PayloadAction<Partial<GeneralSettings>>) => {
      state.general = {
        ...state.general,
        ...action.payload
      };
    },

    // Hero Portrait Settings
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

    // Unit Animation Settings
    updateUnitAnimationSettings: (state, action: PayloadAction<Partial<UnitAnimationSettings>>) => {
      state.general.unitAnimation = {
        ...state.general.unitAnimation,
        ...action.payload
      };
    },

    resetUnitAnimationSettings: (state) => {
      state.general.unitAnimation = defaultUnitAnimationSettings;
    },

    // Global Actions
    resetAllSettings: (state) => {
      state.health = DEFAULT_HEALTH_DISPLAY_SETTINGS;
      state.scoreboards = {};
      state.general = {
        heroPortrait: defaultHeroPortraitSettings,
        unitAnimation: defaultUnitAnimationSettings
      };
      state.version = SETTINGS_VERSION;
    },

    loadSettings: (state, action: PayloadAction<SettingsState>) => {
      const migrated = migrateSettings(action.payload);
      state.health = migrated.health;
      // Migrate old single scoreboard to per-widget structure if needed
      if (migrated.scoreboard && !migrated.scoreboards) {
        // If old format exists, convert to new format (but we're wiping settings per user request)
        state.scoreboards = {};
      } else {
        state.scoreboards = migrated.scoreboards || {};
      }
      state.general = migrated.general;
      state.version = migrated.version;
    },

    // Import/Export
    importSettings: (state, action: PayloadAction<string>) => {
      try {
        const parsed = JSON.parse(action.payload);
        const migrated = migrateSettings(parsed);
        state.health = migrated.health;
        // Migrate old single scoreboard to per-widget structure if needed
        if (migrated.scoreboard && !migrated.scoreboards) {
          state.scoreboards = {};
        } else {
          state.scoreboards = migrated.scoreboards || {};
        }
        state.general = migrated.general;
        state.version = migrated.version;
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
  resetAllSettings,
  loadSettings,
  importSettings
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selector helpers
export const selectHealthSettings = (state: { settings: SettingsState }) => state.settings.health;
export const selectScoreboardSettings = (widgetId: string) => (state: { settings: SettingsState }): ScoreboardSettings => {
  // Return widget-specific settings or default if not initialized
  if (!state.settings.scoreboards[widgetId]) {
    return defaultScoreboardSettings;
  }
  return state.settings.scoreboards[widgetId];
};
export const selectGeneralSettings = (state: { settings: SettingsState }) => state.settings.general;
export const selectHeroPortraitSettings = (state: { settings: SettingsState }) => state.settings.general.heroPortrait;
export const selectUnitAnimationSettings = (state: { settings: SettingsState }) => state.settings.general.unitAnimation;

