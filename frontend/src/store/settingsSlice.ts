import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { HealthDisplaySettings } from '@/components/ui/HealthDisplay/HealthDisplaySettings';
import type { ScoreboardColumnConfig } from '@/types';
import { DEFAULT_HEALTH_DISPLAY_SETTINGS } from '@/components/ui/HealthDisplay/HealthDisplaySettings';
import { GLOBAL_SCOREBOARD_SETTINGS_ID } from '@/features/scoreboard/constants';

const SETTINGS_VERSION = 2;

const clampBenchOrganizeTimingScale = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1;
  }
  return Math.min(4, Math.max(0.25, value));
};

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
  /** Scale scoreboard rows/columns to fit the viewport without scrolling. */
  scoreboardFitToViewport: boolean;
  /** Multiplier for bench automation delays (1 = default; higher = slower). */
  benchOrganizeTimingScale: number;
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
  trailLength: 1,
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
      showSynergyPips: false,
      scoreboardFitToViewport: false,
      benchOrganizeTimingScale: 1
    }
};

const migrateScoreboards = (
  scoreboards: Record<string, ScoreboardSettings>
): Record<string, ScoreboardSettings> => {
  const migrated = { ...scoreboards };
  if (migrated['scoreboard-1'] && !migrated[GLOBAL_SCOREBOARD_SETTINGS_ID]) {
    migrated[GLOBAL_SCOREBOARD_SETTINGS_ID] = migrated['scoreboard-1'];
  }
  delete migrated['scoreboard-1'];
  return migrated;
};

const mergeScoreboardSettings = (
  widgetId: string,
  scoreboards: Record<string, ScoreboardSettings>
): ScoreboardSettings => {
  const global = scoreboards[GLOBAL_SCOREBOARD_SETTINGS_ID];
  const widget =
    widgetId !== GLOBAL_SCOREBOARD_SETTINGS_ID ? scoreboards[widgetId] : undefined;

  return {
    columns: {
      ...defaultScoreboardSettings.columns,
      ...global?.columns,
      ...widget?.columns,
    },
    sortField: widget?.sortField ?? global?.sortField ?? defaultScoreboardSettings.sortField,
    sortDirection:
      widget?.sortDirection ?? global?.sortDirection ?? defaultScoreboardSettings.sortDirection,
  };
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
    scoreboards: migrateScoreboards(s.scoreboards ?? {}),
    general: {
      theme: s.general?.theme,
      heroPortrait: s.general?.heroPortrait ?? defaultHeroPortraitSettings,
      unitAnimation: s.general?.unitAnimation ?? defaultUnitAnimationSettings,
      showSynergyPips: s.general?.showSynergyPips ?? false,
      scoreboardFitToViewport: s.general?.scoreboardFitToViewport ?? false,
      benchOrganizeTimingScale: clampBenchOrganizeTimingScale(s.general?.benchOrganizeTimingScale)
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

    updateScoreboardFitToViewport: (state, action: PayloadAction<boolean>) => {
      state.general.scoreboardFitToViewport = action.payload;
    },

    resetAllSettings: (state) => {
      state.health = DEFAULT_HEALTH_DISPLAY_SETTINGS;
      state.scoreboards = {};
      state.general = {
        heroPortrait: defaultHeroPortraitSettings,
        unitAnimation: defaultUnitAnimationSettings,
        showSynergyPips: false,
        scoreboardFitToViewport: false,
        benchOrganizeTimingScale: 1
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
  updateScoreboardFitToViewport,
  resetAllSettings,
  loadSettings,
  importSettings
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
export const selectHealthSettings = (state: { settings: SettingsState }) => state.settings.health;

const _scoreboardsSelector = (state: { settings: SettingsState }) => state.settings.scoreboards;
const _scoreboardSelectorCache = new Map<string, (state: { settings: SettingsState }) => ScoreboardSettings>();

/**
 * Returns a memoized selector for a specific widget's scoreboard settings.
 * The same selector instance is reused per widgetId so createSelector's cache
 * kicks in and prevents new object references on every render.
 */
export const selectScoreboardSettings = (widgetId: string) => {
  if (!_scoreboardSelectorCache.has(widgetId)) {
    _scoreboardSelectorCache.set(
      widgetId,
      createSelector(
        _scoreboardsSelector,
        (scoreboards) => mergeScoreboardSettings(widgetId, scoreboards)
      )
    );
  }
  return _scoreboardSelectorCache.get(widgetId)!;
};
export const selectGeneralSettings = (state: { settings: SettingsState }) => state.settings.general;
export const selectHeroPortraitSettings = (state: { settings: SettingsState }) => state.settings.general.heroPortrait;
export const selectUnitAnimationSettings = (state: { settings: SettingsState }) => state.settings.general.unitAnimation;
export const selectShowSynergyPips = (state: { settings: SettingsState }) => state.settings.general.showSynergyPips;
export const selectScoreboardFitToViewport = (state: { settings: SettingsState }) =>
  state.settings.general.scoreboardFitToViewport ?? false;
export const selectBenchOrganizeTimingScale = (state: { settings: SettingsState }) =>
  state.settings.general.benchOrganizeTimingScale ?? 1;
