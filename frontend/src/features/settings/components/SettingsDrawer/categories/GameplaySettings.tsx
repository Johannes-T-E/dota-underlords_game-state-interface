import { Button } from '@/components/ui';
import { ToggleSwitch } from '../../ToggleSwitch/ToggleSwitch';
import { IconRadio } from '../../IconRadio/IconRadio';
import { SettingsSection } from '../../SettingsSection/SettingsSection';
import { SettingsGroup } from '../../SettingsGroup/SettingsGroup';
import { SettingsRow } from '../../SettingsRow/SettingsRow';
import SynergyDisplay from '@/components/ui/SynergyDisplay/SynergyDisplay';
import { useScoreboardSettings } from '@/features/scoreboard/hooks/useScoreboardSettings';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { selectShowSynergyPips, updateShowSynergyPips } from '@/store/settingsSlice';
import type { ScoreboardColumnConfig } from '@/types';
import './SettingsCategories.css';

const COLUMN_CONFIG: Array<{
  key: keyof ScoreboardColumnConfig;
  label: string;
  icon: string;
  recommended?: boolean;
}> = [
  { key: 'place', label: 'Place', icon: '', recommended: true },
  { key: 'playerName', label: 'Player Name', icon: '', recommended: true },
  { key: 'level', label: 'Level', icon: '', recommended: true },
  { key: 'gold', label: 'Gold', icon: '', recommended: true },
  { key: 'streak', label: 'Streak', icon: '' },
  { key: 'health', label: 'Health', icon: '', recommended: true },
  { key: 'record', label: 'Win/Loss', icon: '', recommended: true },
  { key: 'networth', label: 'Net Worth', icon: '' },
  { key: 'roster', label: 'Roster', icon: '', recommended: true },
  { key: 'underlord', label: 'Underlord', icon: '' },
  { key: 'contraptions', label: 'Contraptions', icon: '' },
  { key: 'bench', label: 'Bench', icon: '' }
];

const LAYOUT_PRESETS: { [key: string]: Partial<ScoreboardColumnConfig> } = {
  compact: {
    place: true,
    playerName: true,
    level: true,
    health: true,
    record: true,
    gold: false,
    streak: false,
    networth: false,
    roster: false,
    underlord: false,
    contraptions: false,
    bench: false
  },
  standard: {
    place: true,
    playerName: true,
    level: true,
    gold: true,
    health: true,
    record: true,
    networth: true,
    roster: true,
    streak: false,
    underlord: false,
    contraptions: false,
    bench: false
  },
  complete: {
    place: true,
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
    bench: true
  }
};

export const GameplaySettings = () => {
  // Settings drawer affects all scoreboard widgets (using a special 'all' identifier)
  // Individual widgets have their own settings via the widget header
  // For now, we'll use a default widget ID - users should use widget-specific settings
  const { settings, updateColumns, updateSort, resetSettings } = useScoreboardSettings('scoreboard-1');
  const dispatch = useAppDispatch();
  const showSynergyPips = useAppSelector(selectShowSynergyPips);

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
    COLUMN_CONFIG.forEach(col => {
      if (col.key !== 'columnOrder') {
        (allEnabled as any)[col.key] = true;
      }
    });
    updateColumns(allEnabled);
  };

  const handleHideAll = () => {
    const allDisabled: Partial<ScoreboardColumnConfig> = {};
    COLUMN_CONFIG.forEach(col => {
      if (col.key !== 'columnOrder') {
        (allDisabled as any)[col.key] = false;
      }
    });
    updateColumns(allDisabled);
  };

  const handleResetToRecommended = () => {
    const recommended: Partial<ScoreboardColumnConfig> = {};
    COLUMN_CONFIG.forEach(col => {
      if (col.key !== 'columnOrder') {
        (recommended as any)[col.key] = col.recommended || false;
      }
    });
    updateColumns(recommended);
  };

  return (
    <div className="settings-category">
      <div className="settings-category__header">
        <h2 className="settings-category__title">Gameplay</h2>
        <p className="settings-category__description">
          Configure scoreboard display and gameplay-related settings
        </p>
      </div>

      {/* Scoreboard Display Section */}
      <SettingsSection 
        title="Scoreboard Display" 
        description="Customize which columns are visible in the scoreboard"
        defaultOpen={true}
      >
        {/* Layout Presets */}
        <SettingsGroup variant="card" title="Layout Presets">
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

        {/* Column Visibility Grid */}
        <SettingsGroup variant="card" title="Column Visibility">
          <div className="settings-inline-preview settings-inline-preview--synergy">
            <span className="settings-inline-preview__label">Synergy preview:</span>
            <SynergyDisplay
              keyword={1}
              levels={[{ unitcount: 2 }, { unitcount: 4 }, { unitcount: 6 }]}
              activeUnits={4}
              benchUnits={1}
              showPips={showSynergyPips}
              compactPipWidthByTierCount={showSynergyPips}
            />
          </div>
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
                        RECOMMENDED
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

        {/* Sorting Options */}
        <SettingsGroup variant="card" title="Sorting">
          <div className="settings-stack">
            <label className="settings-section-heading">Sort By:</label>
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
                label="Wins/Losses"
                description="7W-2L"
                icon=""
              />
              <IconRadio
                name="sortField"
                value="networth"
                checked={settings.sortField === 'networth'}
                onChange={(value) => updateSort({ field: value as 'health' | 'record' | 'networth' })}
                label="Net Worth"
                description="9999"
                icon=""
              />
            </div>

            <div className="settings-section-offset">
              <label className="settings-section-heading">Sort Direction:</label>
              <div className="settings-section-offset">
                <Button
                  variant={settings.sortDirection === 'desc' ? 'primary' : 'secondary'}
                  size="small"
                  onClick={() => updateSort({ direction: settings.sortDirection === 'desc' ? 'asc' : 'desc' })}
                >
                  {settings.sortDirection === 'desc' ? '↓ High to Low' : '↑ Low to High'}
                </Button>
              </div>
            </div>
          </div>
        </SettingsGroup>
        <SettingsGroup variant="card" title="Synergy Display">
          <SettingsRow
            label="Show Synergy Pips"
            description="Enable pip segments in the synergy column."
          >
            <ToggleSwitch
              checked={showSynergyPips}
              onChange={(checked) => dispatch(updateShowSynergyPips(checked))}
            />
          </SettingsRow>
        </SettingsGroup>

        <Button variant="secondary" onClick={resetSettings}>
          Reset Scoreboard Settings
        </Button>
      </SettingsSection>
    </div>
  );
};

