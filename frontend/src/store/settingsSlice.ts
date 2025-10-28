import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HealthDisplaySettings } from '../components/molecules/HealthDisplay/HealthDisplaySettings';
import type { ScoreboardColumnConfig } from '../types';
import { DEFAULT_HEALTH_DISPLAY_SETTINGS } from '../components/molecules/HealthDisplay/HealthDisplaySettings';

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

export interface GeneralSettings {
  theme?: string;
  heroPortrait: HeroPortraitSettings;
}

export interface SettingsState {
  version: number;
  health: HealthDisplaySettings;
  scoreboard: ScoreboardSettings;
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

const initialState: SettingsState = {
  version: SETTINGS_VERSION,
  health: DEFAULT_HEALTH_DISPLAY_SETTINGS,
  scoreboard: defaultScoreboardSettings,
  general: {
    heroPortrait: defaultHeroPortraitSettings
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
    // Migration for version 1: Add new column properties
    if (settings.scoreboard && settings.scoreboard.columns) {
      // Ensure new column properties exist with default values
      if (settings.scoreboard.columns.underlord === undefined) {
        settings.scoreboard.columns.underlord = true;
      }
      if (settings.scoreboard.columns.contraptions === undefined) {
        settings.scoreboard.columns.contraptions = true;
      }
      
      // Update column order if it doesn't include new columns
      if (settings.scoreboard.columns.columnOrder) {
        const currentOrder = settings.scoreboard.columns.columnOrder;
        const rosterIndex = currentOrder.indexOf('roster');
        const benchIndex = currentOrder.indexOf('bench');
        
        if (rosterIndex !== -1 && benchIndex !== -1 && 
            !currentOrder.includes('underlord') && !currentOrder.includes('contraptions')) {
          // Insert new columns between roster and bench
          currentOrder.splice(rosterIndex + 1, 0, 'underlord', 'contraptions');
        }
      }
    }
    
    settings.version = SETTINGS_VERSION;
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

    // Scoreboard Settings
    updateScoreboardColumns: (state, action: PayloadAction<Partial<ScoreboardColumnConfig>>) => {
      state.scoreboard.columns = {
        ...state.scoreboard.columns,
        ...action.payload
      };
    },

    updateScoreboardSort: (state, action: PayloadAction<{ field?: 'health' | 'record' | 'networth'; direction?: 'asc' | 'desc' }>) => {
      if (action.payload.field) {
        state.scoreboard.sortField = action.payload.field;
      }
      if (action.payload.direction) {
        state.scoreboard.sortDirection = action.payload.direction;
      }
    },

    resetScoreboardSettings: (state) => {
      state.scoreboard = defaultScoreboardSettings;
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

    // Global Actions
    resetAllSettings: (state) => {
      state.health = DEFAULT_HEALTH_DISPLAY_SETTINGS;
      state.scoreboard = defaultScoreboardSettings;
      state.general = {
        heroPortrait: defaultHeroPortraitSettings
      };
      state.version = SETTINGS_VERSION;
    },

    loadSettings: (state, action: PayloadAction<SettingsState>) => {
      const migrated = migrateSettings(action.payload);
      state.health = migrated.health;
      state.scoreboard = migrated.scoreboard;
      state.general = migrated.general;
      state.version = migrated.version;
    },

    // Import/Export
    importSettings: (state, action: PayloadAction<string>) => {
      try {
        const parsed = JSON.parse(action.payload);
        const migrated = migrateSettings(parsed);
        state.health = migrated.health;
        state.scoreboard = migrated.scoreboard;
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
  resetAllSettings,
  loadSettings,
  importSettings
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selector helpers
export const selectHealthSettings = (state: { settings: SettingsState }) => state.settings.health;
export const selectScoreboardSettings = (state: { settings: SettingsState }) => state.settings.scoreboard;
export const selectGeneralSettings = (state: { settings: SettingsState }) => state.settings.general;
export const selectHeroPortraitSettings = (state: { settings: SettingsState }) => state.settings.general.heroPortrait;

