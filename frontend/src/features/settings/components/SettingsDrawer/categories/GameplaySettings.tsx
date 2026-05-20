import { Button } from '@/components/ui';
import { ToggleSwitch } from '../../ToggleSwitch/ToggleSwitch';
import { IconRadio } from '../../IconRadio/IconRadio';
import { SettingsTopicPanel } from '../../SettingsTopicPanel/SettingsTopicPanel';
import { SettingsGroup } from '../../SettingsGroup/SettingsGroup';
import { SettingsRow } from '../../SettingsRow/SettingsRow';
import SynergyDisplay from '@/components/ui/SynergyDisplay/SynergyDisplay';
import { useScoreboardSettings } from '@/features/scoreboard/hooks/useScoreboardSettings';
import { GLOBAL_SCOREBOARD_SETTINGS_ID } from '@/features/scoreboard/constants';
import {
  COLUMN_PREVIEW_LABELS,
  DEFAULT_SCOREBOARD_COLUMN_ORDER,
  GAMEPLAY_COLUMN_TOGGLES,
} from '@/features/scoreboard/scoreboardColumns';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { selectShowSynergyPips, selectShowPlayerRankText, updateShowSynergyPips, updateShowPlayerRankText } from '@/store/settingsSlice';
import type { ScoreboardColumnConfig } from '@/types';
import './SettingsCategories.css';

const COLUMN_CONFIG = GAMEPLAY_COLUMN_TOGGLES;

const LAYOUT_PRESETS: { [key: string]: Partial<ScoreboardColumnConfig> } = {
  compact: {
    place: true,
    playerRank: false,
    playerName: true,
    level: true,
    health: true,
    record: true,
    gold: false,
    streak: false,
    networth: false,
    synergies: false,
    roster: false,
    underlord: false,
    contraptions: false,
    bench: false
  },
  standard: {
    place: true,
    playerRank: true,
    playerName: true,
    level: true,
    gold: true,
    health: true,
    record: true,
    networth: true,
    synergies: true,
    roster: true,
    streak: false,
    underlord: false,
    contraptions: false,
    bench: false
  },
  complete: {
    place: true,
    playerRank: true,
    playerName: true,
    level: true,
    gold: true,
    streak: true,
    health: true,
    record: true,
    networth: true,
    synergies: true,
    roster: true,
    underlord: true,
    contraptions: true,
    bench: true
  }
};

const DEFAULT_COLUMN_ORDER = [...DEFAULT_SCOREBOARD_COLUMN_ORDER];

export const GameplaySettings = () => {
  const { settings, updateColumns, updateSort, resetSettings } = useScoreboardSettings(
    GLOBAL_SCOREBOARD_SETTINGS_ID
  );
  const dispatch = useAppDispatch();
  const showSynergyPips = useAppSelector(selectShowSynergyPips);
  const showPlayerRankText = useAppSelector(selectShowPlayerRankText);

  const handleColumnToggle = (key: keyof ScoreboardColumnConfig, value: boolean) => {
    updateColumns({ [key]: value });
  };

  const handlePresetChange = (preset: string) => {
    const presetConfig = LAYOUT_PRESETS[preset];
    if (presetConfig) {
      updateColumns(presetConfig);
    }
  };

  const handleShowAll = () => {
    const allEnabled: Partial<ScoreboardColumnConfig> = {};
    COLUMN_CONFIG.forEach((col) => {
      (allEnabled as Partial<ScoreboardColumnConfig>)[col.key] = true;
    });
    updateColumns(allEnabled);
  };

  const handleHideAll = () => {
    const allDisabled: Partial<ScoreboardColumnConfig> = {};
    COLUMN_CONFIG.forEach((col) => {
      (allDisabled as Partial<ScoreboardColumnConfig>)[col.key] = false;
    });
    updateColumns(allDisabled);
  };

  const handleResetToRecommended = () => {
    const recommended: Partial<ScoreboardColumnConfig> = {};
    COLUMN_CONFIG.forEach((col) => {
      (recommended as Partial<ScoreboardColumnConfig>)[col.key] = col.recommended ?? false;
    });
    updateColumns(recommended);
  };

  const columnOrder = settings.columns.columnOrder ?? DEFAULT_COLUMN_ORDER;
  const visiblePreviewColumns = columnOrder.filter((key) => {
    const value = settings.columns[key as keyof ScoreboardColumnConfig];
    return typeof value === 'boolean' && value;
  });

  return (
    <div className="settings-category">
      <div className="settings-category__header">
        <h2 className="settings-category__title">Gameplay</h2>
        <p className="settings-category__description">
          Configure scoreboard display and gameplay-related settings
        </p>
      </div>

      <SettingsTopicPanel
        id="settings-columns"
        title="Scoreboard columns"
        description="Which columns appear on every scoreboard"
        preview={
          <div className="settings-column-preview" aria-live="polite">
            {visiblePreviewColumns.length > 0 ? (
              visiblePreviewColumns.map((key) => (
                <span key={key} className="settings-column-preview__col">
                  {COLUMN_PREVIEW_LABELS[key] ?? key}
                </span>
              ))
            ) : (
              <span className="settings-column-preview__empty">No columns visible</span>
            )}
          </div>
        }
      >
        <SettingsGroup variant="default" title="Layout presets">
          <div className="settings-row-wrap">
            <Button variant="secondary" size="small" onClick={() => handlePresetChange('compact')}>
              Compact
            </Button>
            <Button variant="secondary" size="small" onClick={() => handlePresetChange('standard')}>
              Standard
            </Button>
            <Button variant="secondary" size="small" onClick={() => handlePresetChange('complete')}>
              Complete
            </Button>
          </div>
          <div className="settings-row-wrap settings-row-wrap--compact">
            <Button variant="ghost" size="small" onClick={handleShowAll}>
              Show All
            </Button>
            <Button variant="ghost" size="small" onClick={handleHideAll}>
              Hide All
            </Button>
            <Button variant="ghost" size="small" onClick={handleResetToRecommended}>
              Reset to Recommended
            </Button>
          </div>
        </SettingsGroup>

        <SettingsGroup variant="default" title="Visible columns">
          <div className="settings-grid">
            {COLUMN_CONFIG.map((col) => {
              const isChecked = typeof settings.columns[col.key] === 'boolean' 
                ? settings.columns[col.key] as boolean
                : false;
              
              return (
                <div
                  key={col.key}
                  className={`settings-option-tile ${isChecked ? 'settings-option-tile--active' : ''}`}
                >
                  <div className="settings-fill">
                    <div className="settings-option-tile__label">{col.label}</div>
                    {col.recommended && (
                      <div className="settings-option-tile__meta">
                        Recommended
                      </div>
                    )}
                  </div>
                  <ToggleSwitch
                    checked={isChecked}
                    onChange={(checked) => handleColumnToggle(col.key, checked)}
                  />
                </div>
              );
            })}
          </div>
        </SettingsGroup>

      </SettingsTopicPanel>

      <SettingsTopicPanel
        id="settings-sorting"
        title="Sorting & synergies"
        description="Default sort order and synergy column display"
        preview={
          <SynergyDisplay
            keyword={1}
            levels={[{ unitcount: 2 }, { unitcount: 4 }, { unitcount: 6 }]}
            activeUnits={4}
            benchUnits={1}
            showPips={showSynergyPips}
            compactPipWidthByTierCount={showSynergyPips}
          />
        }
      >
        <SettingsGroup variant="default" title="Sort by">
          <div className="settings-stack settings-stack--compact">
            <IconRadio
              name="sortField"
              value="health"
              checked={settings.sortField === 'health'}
              onChange={(value) => updateSort({ field: value as 'health' | 'record' | 'networth' })}
              label="Health"
              description="100 → 0"
              icon=""
            />
            <IconRadio
              name="sortField"
              value="record"
              checked={settings.sortField === 'record'}
              onChange={(value) => updateSort({ field: value as 'health' | 'record' | 'networth' })}
              label="Wins / losses"
              description="7W-2L"
              icon=""
            />
            <IconRadio
              name="sortField"
              value="networth"
              checked={settings.sortField === 'networth'}
              onChange={(value) => updateSort({ field: value as 'health' | 'record' | 'networth' })}
              label="Net worth"
              description="9999"
              icon=""
            />
          </div>
          <div className="settings-section-offset">
            <label className="settings-section-heading">Direction</label>
            <Button
              variant={settings.sortDirection === 'desc' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => updateSort({ direction: settings.sortDirection === 'desc' ? 'asc' : 'desc' })}
            >
              {settings.sortDirection === 'desc' ? '↓ High to low' : '↑ Low to high'}
            </Button>
          </div>
        </SettingsGroup>

        <SettingsGroup variant="transparent">
          <SettingsRow
            label="Show rank text"
            description="Rank name beside medal pin in the Rank column"
          >
            <ToggleSwitch
              checked={showPlayerRankText}
              onChange={(checked) => dispatch(updateShowPlayerRankText(checked))}
            />
          </SettingsRow>
          <SettingsRow
            label="Show synergy pips"
            description="Pip segments in the synergy column"
          >
            <ToggleSwitch
              checked={showSynergyPips}
              onChange={(checked) => dispatch(updateShowSynergyPips(checked))}
            />
          </SettingsRow>
        </SettingsGroup>

        <Button variant="secondary" onClick={resetSettings}>
          Reset scoreboard settings
        </Button>
      </SettingsTopicPanel>
    </div>
  );
};

