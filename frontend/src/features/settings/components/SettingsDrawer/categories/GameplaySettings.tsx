import { Button } from '@/components/ui';
import { ToggleSwitch } from '../../ToggleSwitch/ToggleSwitch';
import { IconRadio } from '../../IconRadio/IconRadio';
import { SettingsSection } from '../../SettingsSection/SettingsSection';
import { SettingsGroup } from '../../SettingsGroup/SettingsGroup';
import { useScoreboardSettings } from '@/features/scoreboard/hooks/useScoreboardSettings';
import type { ScoreboardColumnConfig } from '@/types';

const COLUMN_CONFIG: Array<{
  key: keyof ScoreboardColumnConfig;
  label: string;
  icon: string;
  recommended?: boolean;
}> = [
  { key: 'place', label: 'Place', icon: '🏆', recommended: true },
  { key: 'playerName', label: 'Player Name', icon: '👤', recommended: true },
  { key: 'level', label: 'Level', icon: '⭐', recommended: true },
  { key: 'gold', label: 'Gold', icon: '💰', recommended: true },
  { key: 'streak', label: 'Streak', icon: '🔥' },
  { key: 'health', label: 'Health', icon: '❤️', recommended: true },
  { key: 'record', label: 'Win/Loss', icon: '📊', recommended: true },
  { key: 'networth', label: 'Net Worth', icon: '💎' },
  { key: 'roster', label: 'Roster', icon: '⚔️', recommended: true },
  { key: 'underlord', label: 'Underlord', icon: '👑' },
  { key: 'contraptions', label: 'Contraptions', icon: '🔧' },
  { key: 'bench', label: 'Bench', icon: '🪑' }
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

  const handleColumnToggle = (key: keyof ScoreboardColumnConfig, value: boolean) => {
    updateColumns({ [key]: value });
  };

  const handlePresetChange = (preset: string) => {
    updateColumns(LAYOUT_PRESETS[preset]);
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
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {COLUMN_CONFIG.map((col) => {
              const isChecked = typeof settings.columns[col.key] === 'boolean' 
                ? settings.columns[col.key] as boolean
                : false;
              
              return (
                <div
                  key={col.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: isChecked
                      ? 'rgba(88, 101, 242, 0.1)' 
                      : 'rgba(255, 255, 255, 0.02)',
                    border: `2px solid ${isChecked ? '#5865f2' : 'var(--border-color)'}`,
                    borderRadius: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{col.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: 'var(--text-color)', 
                      fontSize: '14px', 
                      fontWeight: 500 
                    }}>
                      {col.label}
                    </div>
                    {col.recommended && (
                      <div style={{ 
                        color: '#5865f2', 
                        fontSize: '11px',
                        fontWeight: 600 
                      }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ color: 'var(--text-color)', fontSize: '14px', fontWeight: 500 }}>
              Sort By:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <IconRadio
                name="sortField"
                value="health"
                checked={settings.sortField === 'health'}
                onChange={(value) => updateSort({ field: value as 'health' | 'record' | 'networth' })}
                label="Health"
                description="100 → 0"
                icon="❤️"
              />
              <IconRadio
                name="sortField"
                value="record"
                checked={settings.sortField === 'record'}
                onChange={(value) => updateSort({ field: value as 'health' | 'record' | 'networth' })}
                label="Wins/Losses"
                description="7W-2L"
                icon="📊"
              />
              <IconRadio
                name="sortField"
                value="networth"
                checked={settings.sortField === 'networth'}
                onChange={(value) => updateSort({ field: value as 'health' | 'record' | 'networth' })}
                label="Net Worth"
                description="💰 9999"
                icon="💎"
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <label style={{ color: 'var(--text-color)', fontSize: '14px', fontWeight: 500 }}>
                Sort Direction:
              </label>
              <div style={{ marginTop: '8px' }}>
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

        <Button variant="secondary" onClick={resetSettings}>
          Reset Scoreboard Settings
        </Button>
      </SettingsSection>
    </div>
  );
};

