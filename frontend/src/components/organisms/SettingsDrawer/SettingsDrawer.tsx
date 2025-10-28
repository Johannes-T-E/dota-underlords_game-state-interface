import { useState, useCallback } from 'react';
import { Button } from '../../atoms';
import { useGlobalSettings } from '../../../hooks/useSettings';
import { AppearanceSettings } from './categories/AppearanceSettings';
import { GameplaySettings } from './categories/GameplaySettings';
import { AdvancedSettings } from './categories/AdvancedSettings';
import { AboutSettings } from './categories/AboutSettings';
import './SettingsDrawer.css';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsCategory = 'appearance' | 'gameplay' | 'advanced' | 'about';

export const SettingsDrawer = ({ isOpen, onClose }: SettingsDrawerProps) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');
  const { resetAll, exportSettings, importSettings } = useGlobalSettings();

  const handleExport = useCallback(() => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `underlords-settings-${new Date().toISOString().split('T')[0]}.json`;
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
      <div className="settings-drawer-v2" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-drawer-v2__header">
          <h2 className="settings-drawer-v2__title">Settings</h2>
          <Button variant="ghost" size="small" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="settings-drawer-v2__main">
          {/* Sidebar Navigation */}
          <nav className="settings-drawer-v2__sidebar">
            <button
              className={`settings-drawer-v2__nav-item ${activeCategory === 'appearance' ? 'settings-drawer-v2__nav-item--active' : ''}`}
              onClick={() => setActiveCategory('appearance')}
            >
              <span className="settings-drawer-v2__nav-icon">🎨</span>
              <span className="settings-drawer-v2__nav-label">Appearance</span>
            </button>
            <button
              className={`settings-drawer-v2__nav-item ${activeCategory === 'gameplay' ? 'settings-drawer-v2__nav-item--active' : ''}`}
              onClick={() => setActiveCategory('gameplay')}
            >
              <span className="settings-drawer-v2__nav-icon">🎮</span>
              <span className="settings-drawer-v2__nav-label">Gameplay</span>
            </button>
            <button
              className={`settings-drawer-v2__nav-item ${activeCategory === 'advanced' ? 'settings-drawer-v2__nav-item--active' : ''}`}
              onClick={() => setActiveCategory('advanced')}
            >
              <span className="settings-drawer-v2__nav-icon">⚙️</span>
              <span className="settings-drawer-v2__nav-label">Advanced</span>
            </button>
            <button
              className={`settings-drawer-v2__nav-item ${activeCategory === 'about' ? 'settings-drawer-v2__nav-item--active' : ''}`}
              onClick={() => setActiveCategory('about')}
            >
              <span className="settings-drawer-v2__nav-icon">ℹ️</span>
              <span className="settings-drawer-v2__nav-label">About</span>
            </button>
          </nav>

          {/* Content Panel */}
          <div className="settings-drawer-v2__content">
            {activeCategory === 'appearance' && <AppearanceSettings />}
            {activeCategory === 'gameplay' && <GameplaySettings />}
            {activeCategory === 'advanced' && (
              <AdvancedSettings 
                onExport={handleExport}
                onImport={handleImport}
                onResetAll={handleResetAll}
              />
            )}
            {activeCategory === 'about' && <AboutSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};
