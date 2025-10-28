import { useState, useCallback } from 'react';
import { Button } from '../../atoms';
import { HealthDisplay } from '../../molecules/HealthDisplay/HealthDisplay';
import { useHealthSettings, useScoreboardSettings, useGlobalSettings, useHeroPortraitSettings } from '../../../hooks/useSettings';
import { websocketService } from '../../../services/websocket';
import type { HealthColorConfig, ColorStop, InterpolationConfig } from '../../molecules/HealthDisplay/HealthDisplaySettings';
import type { MatchData } from '../../../types';
import './SettingsDrawer.css';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validation helpers
const validateColor = (color: string): boolean => {
  return /^(rgb\(\d+,\s*\d+,\s*\d+\)|#[0-9a-fA-F]{6})$/.test(color);
};

const validatePosition = (position: number): boolean => {
  return position >= 0 && position <= 100;
};

export const SettingsDrawer = ({ isOpen, onClose }: SettingsDrawerProps) => {
  const [activeTab, setActiveTab] = useState<'health' | 'scoreboard' | 'general'>('health');
  const { resetAll, exportSettings, importSettings } = useGlobalSettings();

  const handleExport = useCallback(() => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'underlords-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSettings]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = e.target?.result as string;
            importSettings(json);
          } catch (error) {
            alert('Failed to import settings. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [importSettings]);

  const handleResetAll = useCallback(() => {
    if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
      resetAll();
    }
  }, [resetAll]);

  if (!isOpen) return null;

  return (
    <div className="settings-drawer-overlay" onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="settings-drawer__header">
          <h2>Settings</h2>
          <Button variant="ghost" size="small" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="settings-drawer__tabs">
          <button 
            className={`settings-tab ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            Health Display
          </button>
          <button 
            className={`settings-tab ${activeTab === 'scoreboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('scoreboard')}
          >
            Scoreboard
          </button>
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
        </div>

        <div className="settings-drawer__content">
          {activeTab === 'health' && <HealthSettingsTab />}
          {activeTab === 'scoreboard' && <ScoreboardSettingsTab />}
          {activeTab === 'general' && <GeneralSettingsTab />}
        </div>

        <div className="settings-drawer__footer">
          <div className="settings-actions">
            <Button variant="secondary" size="small" onClick={handleImport}>
              Import
            </Button>
            <Button variant="secondary" size="small" onClick={handleExport}>
              Export
            </Button>
            <Button variant="danger" size="small" onClick={handleResetAll}>
              Reset All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Health Settings Tab Component
const HealthSettingsTab = () => {
  const { settings, updateSettings, resetSettings } = useHealthSettings();

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handleStylingChange = (key: string, value: string | number) => {
    updateSettings({
      styling: {
        ...settings.styling,
        [key]: value
      }
    });
  };

  const handleColorStopAdd = () => {
    const newStop: ColorStop = {
      position: 50,
      color: 'rgb(255, 255, 0)'
    };
    const newConfig: HealthColorConfig = {
      ...settings.colorConfig!,
      colorStops: [...settings.colorConfig!.colorStops, newStop]
    };
    updateSettings({ colorConfig: newConfig });
  };

  const handleColorStopRemove = (index: number) => {
    const newConfig: HealthColorConfig = {
      ...settings.colorConfig!,
      colorStops: settings.colorConfig!.colorStops.filter((_, i) => i !== index)
    };
    updateSettings({ colorConfig: newConfig });
  };

  const handleColorStopChange = (index: number, field: 'position' | 'color', value: string | number) => {
    // Validate input
    if (field === 'position' && !validatePosition(value as number)) {
      alert('Position must be between 0 and 100');
      return;
    }
    if (field === 'color' && !validateColor(value as string)) {
      alert('Invalid color format. Use rgb(r,g,b) or #hex format');
      return;
    }

    const newStops = [...settings.colorConfig!.colorStops];
    newStops[index] = { 
      ...newStops[index], 
      [field]: value 
    } as ColorStop;
    const newConfig: HealthColorConfig = {
      ...settings.colorConfig!,
      colorStops: newStops
    };
    updateSettings({ colorConfig: newConfig });
  };

  const handleInterpolationChange = (type: InterpolationConfig['type']) => {
    const newConfig: HealthColorConfig = {
      ...settings.colorConfig!,
      interpolation: { type }
    };
    updateSettings({ colorConfig: newConfig });
  };

  return (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Display Options</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.showIcon}
              onChange={(e) => handleToggle('showIcon', e.target.checked)}
            />
            Show Heart Icon
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.showValue}
              onChange={(e) => handleToggle('showValue', e.target.checked)}
            />
            Show Health Value
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.animateOnChange}
              onChange={(e) => handleToggle('animateOnChange', e.target.checked)}
            />
            Animate on Health Change
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.useColorTransition}
              onChange={(e) => handleToggle('useColorTransition', e.target.checked)}
            />
            Use Color Transition
          </label>
        </div>
      </div>

      {settings.useColorTransition && (
        <div className="settings-section">
          <h3>Color Configuration</h3>
          <div className="setting-item">
            <label>Interpolation Type:</label>
            <select 
              value={settings.colorConfig?.interpolation.type || 'linear'}
              onChange={(e) => handleInterpolationChange(e.target.value as InterpolationConfig['type'])}
            >
              <option value="linear">Linear</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In Out</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Color Stops:</label>
            <div className="color-stops">
              {settings.colorConfig?.colorStops.map((stop, index) => (
                <div key={index} className="color-stop-item">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={stop.position}
                    onChange={(e) => handleColorStopChange(index, 'position', parseInt(e.target.value))}
                  />
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => handleColorStopChange(index, 'color', e.target.value)}
                  />
                  <Button 
                    variant="danger" 
                    size="small" 
                    onClick={() => handleColorStopRemove(index)}
                    disabled={settings.colorConfig!.colorStops.length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="secondary" size="small" onClick={handleColorStopAdd}>
                Add Color Stop
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-section">
        <h3>Styling</h3>
        <div className="setting-item">
          <label>Font Family:</label>
          <input
            type="text"
            value={settings.styling?.fontFamily || ''}
            onChange={(e) => handleStylingChange('fontFamily', e.target.value)}
            placeholder="e.g., Arial, sans-serif"
          />
        </div>
        <div className="setting-item">
          <label>Font Size:</label>
          <input
            type="text"
            value={settings.styling?.fontSize || '32px'}
            onChange={(e) => handleStylingChange('fontSize', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Font Weight:</label>
          <select 
            value={settings.styling?.fontWeight || 'bold'}
            onChange={(e) => handleStylingChange('fontWeight', e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="bolder">Bolder</option>
            <option value="lighter">Lighter</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="400">400</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700</option>
            <option value="800">800</option>
            <option value="900">900</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Font Style:</label>
          <select 
            value={settings.styling?.fontStyle || 'normal'}
            onChange={(e) => handleStylingChange('fontStyle', e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
            <option value="oblique">Oblique</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Text Shadow:</label>
          <input
            type="text"
            value={settings.styling?.textShadow || '0 0 3px #000'}
            onChange={(e) => handleStylingChange('textShadow', e.target.value)}
            placeholder="e.g., 0 0 3px #000"
          />
        </div>
        <div className="setting-item">
          <label>Icon Font Size:</label>
          <input
            type="text"
            value={settings.styling?.iconFontSize || '32px'}
            onChange={(e) => handleStylingChange('iconFontSize', e.target.value)}
          />
        </div>
        <div className="setting-item">
          <label>Icon Margin:</label>
          <input
            type="text"
            value={settings.styling?.iconMargin || '8px'}
            onChange={(e) => handleStylingChange('iconMargin', e.target.value)}
            placeholder="e.g., 8px, 0.5em"
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Animation Settings</h3>
        <div className="setting-item">
          <label>Animation Duration (ms):</label>
          <input
            type="number"
            min="100"
            max="2000"
            step="100"
            value={settings.styling?.animationDuration || 600}
            onChange={(e) => handleStylingChange('animationDuration', parseInt(e.target.value) || 600)}
          />
        </div>
        <div className="setting-item">
          <label>Animation Easing:</label>
          <select 
            value={settings.styling?.animationEasing || 'ease-in-out'}
            onChange={(e) => handleStylingChange('animationEasing', e.target.value)}
          >
            <option value="linear">Linear</option>
            <option value="ease">Ease</option>
            <option value="ease-in">Ease In</option>
            <option value="ease-out">Ease Out</option>
            <option value="ease-in-out">Ease In Out</option>
            <option value="cubic-bezier(0.25, 0.46, 0.45, 0.94)">Custom Bezier</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Pulse Scale:</label>
          <input
            type="number"
            min="1.0"
            max="2.0"
            step="0.1"
            value={settings.styling?.pulseScale || 1.2}
            onChange={(e) => handleStylingChange('pulseScale', parseFloat(e.target.value) || 1.2)}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>Preview</h3>
        <div className="health-preview">
          <HealthDisplay health={75} settings={settings} />
          <HealthDisplay health={25} settings={settings} />
          <HealthDisplay health={100} settings={settings} />
        </div>
      </div>

      <div className="settings-section">
        <Button variant="secondary" onClick={resetSettings}>
          Reset Health Settings
        </Button>
      </div>
    </div>
  );
};

// Scoreboard Settings Tab Component
const ScoreboardSettingsTab = () => {
  const { settings, updateColumns, updateSort, resetSettings } = useScoreboardSettings();

  const handleColumnToggle = (key: keyof typeof settings.columns, value: boolean) => {
    updateColumns({ [key]: value });
  };

  const handleSortChange = (field: 'health' | 'record' | 'networth') => {
    updateSort({ field });
  };

  const handleSortDirectionChange = (direction: 'asc' | 'desc') => {
    updateSort({ direction });
  };

  return (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Column Visibility</h3>
        {Object.entries(settings.columns).map(([key, value]) => (
          <div key={key} className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleColumnToggle(key as keyof typeof settings.columns, e.target.checked)}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h3>Sorting</h3>
        <div className="setting-item">
          <label>Sort Field:</label>
          <select 
            value={settings.sortField}
            onChange={(e) => handleSortChange(e.target.value as 'health' | 'record' | 'networth')}
          >
            <option value="health">Health</option>
            <option value="record">Record</option>
            <option value="networth">Net Worth</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Sort Direction:</label>
          <select 
            value={settings.sortDirection}
            onChange={(e) => handleSortDirectionChange(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <Button variant="secondary" onClick={resetSettings}>
          Reset Scoreboard Settings
        </Button>
      </div>
    </div>
  );
};

// General Settings Tab Component
const GeneralSettingsTab = () => {
  const { settings: heroPortraitSettings, updateSettings: updateHeroPortraitSettings, updateTierGlowConfig } = useHeroPortraitSettings();
  
  const handleSaveNextUpdate = () => {
    websocketService.enableCaptureNextUpdate();
  };

  const handleLoadDebugData = async () => {
    try {
      const response = await fetch('/debugg_data_match_update.json');
      const data: MatchData = await response.json();
      websocketService.injectDebugData(data);
    } catch (error) {
      console.error('[Debug] Failed to load debug data:', error);
      alert('Failed to load debug data. Please ensure the file exists and is valid JSON.');
    }
  };

  const handleTierGlowToggle = (enabled: boolean) => {
    updateHeroPortraitSettings({ enableTierGlow: enabled });
  };

  const handleTierGlowConfigChange = (key: string, value: boolean | number) => {
    updateTierGlowConfig({ [key]: value });
  };

  return (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Hero Portrait Display</h3>
        <p>Visual enhancements for hero portraits throughout the application.</p>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={heroPortraitSettings?.enableTierGlow || false}
              onChange={(e) => handleTierGlowToggle(e.target.checked)}
            />
            Enable Tier Glow
          </label>
          <div className="setting-description">
            <small>Show colored outlines on hero portraits based on their tier (1-5). Colors match the original game's tier system.</small>
          </div>
        </div>

        {heroPortraitSettings?.enableTierGlow && (
          <>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={heroPortraitSettings?.tierGlowConfig?.enableBorder || false}
                  onChange={(e) => handleTierGlowConfigChange('enableBorder', e.target.checked)}
                />
                Enable Border Effect
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={heroPortraitSettings?.tierGlowConfig?.enableDropShadow || false}
                  onChange={(e) => handleTierGlowConfigChange('enableDropShadow', e.target.checked)}
                />
                Enable Drop Shadow Effect
              </label>
            </div>

            {heroPortraitSettings?.tierGlowConfig?.enableBorder && (
              <div className="setting-item">
                <label>
                  Border Opacity: {Math.round((heroPortraitSettings?.tierGlowConfig?.borderOpacity || 1) * 100)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={heroPortraitSettings?.tierGlowConfig?.borderOpacity || 1}
                    onChange={(e) => handleTierGlowConfigChange('borderOpacity', parseFloat(e.target.value))}
                  />
                </label>
              </div>
            )}

            {heroPortraitSettings?.tierGlowConfig?.enableDropShadow && (
              <div className="setting-item">
                <label>
                  Drop Shadow Opacity: {Math.round((heroPortraitSettings?.tierGlowConfig?.dropShadowOpacity || 1) * 100)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={heroPortraitSettings?.tierGlowConfig?.dropShadowOpacity || 1}
                    onChange={(e) => handleTierGlowConfigChange('dropShadowOpacity', parseFloat(e.target.value))}
                  />
                </label>
              </div>
            )}
          </>
        )}
      </div>

      <div className="settings-section">
        <h3>Debug Tools</h3>
        <p>Tools for capturing and replaying match data for development and debugging.</p>
        
        <div className="setting-item">
          <Button
            variant="secondary"
            size="small"
            onClick={handleSaveNextUpdate}
            className={websocketService.isCaptureEnabled() ? 'debug-button--active' : ''}
            title={websocketService.isCaptureEnabled() ? 'Capture mode enabled - next update will be saved' : 'Save next WebSocket update as JSON file'}
          >
            {websocketService.isCaptureEnabled() ? '⏳ Capturing...' : '💾 Save Next Update'}
          </Button>
        </div>
        
        <div className="setting-item">
          <Button
            variant="secondary"
            size="small"
            onClick={handleLoadDebugData}
            title="Load debug data from debugg_data_match_update.json"
          >
            📁 Load Debug Data
          </Button>
        </div>
        
        <div className="setting-description">
          <small>
            <strong>Save Next Update:</strong> Captures the next WebSocket match update and downloads it as a JSON file.<br/>
            <strong>Load Debug Data:</strong> Loads the saved debug data file to simulate a live match update.
          </small>
        </div>
      </div>
    </div>
  );
};
