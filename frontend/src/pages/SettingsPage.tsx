import { useCallback, useState } from 'react';
import { MainContentTemplate } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui';
import {
  IconAdjustmentsHorizontal,
  IconBrush,
  IconDeviceGamepad2,
  IconInfoCircle,
  IconSettings
} from '@tabler/icons-react';
import { useGlobalSettings } from '@/hooks/useSettings';
import { AppearanceSettings } from '@/features/settings/components/SettingsDrawer/categories/AppearanceSettings';
import { GameplaySettings } from '@/features/settings/components/SettingsDrawer/categories/GameplaySettings';
import { AdvancedSettings } from '@/features/settings/components/SettingsDrawer/categories/AdvancedSettings';
import { AboutSettings } from '@/features/settings/components/SettingsDrawer/categories/AboutSettings';
import './SettingsPage.css';

export const SettingsPage = () => {
  type SettingsCategory = 'appearance' | 'gameplay' | 'advanced' | 'about';
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
        reader.onload = (readerEvent) => {
          try {
            const json = readerEvent.target?.result as string;
            importSettings(json);
          } catch (_error) {
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

  return (
      <MainContentTemplate centered={false} className="settings-page">
        <div className="settings-page__container">
          <PageHeader title="Settings" titleIcon="⚙️" icon={<IconSettings size={18} stroke={1.8} />} />
          <div className="settings-page__content">
            <div className="settings-page__shell">
              <nav className="settings-page__nav">
                <button
                  className={`settings-page__nav-item ${activeCategory === 'appearance' ? 'settings-page__nav-item--active' : ''}`}
                  onClick={() => setActiveCategory('appearance')}
                >
                  <span className="settings-page__nav-icon"><IconBrush size={16} stroke={1.9} /></span>
                  <span className="settings-page__nav-label">Appearance</span>
                </button>
                <button
                  className={`settings-page__nav-item ${activeCategory === 'gameplay' ? 'settings-page__nav-item--active' : ''}`}
                  onClick={() => setActiveCategory('gameplay')}
                >
                  <span className="settings-page__nav-icon"><IconDeviceGamepad2 size={16} stroke={1.9} /></span>
                  <span className="settings-page__nav-label">Gameplay</span>
                </button>
                <button
                  className={`settings-page__nav-item ${activeCategory === 'advanced' ? 'settings-page__nav-item--active' : ''}`}
                  onClick={() => setActiveCategory('advanced')}
                >
                  <span className="settings-page__nav-icon"><IconAdjustmentsHorizontal size={16} stroke={1.9} /></span>
                  <span className="settings-page__nav-label">Advanced</span>
                </button>
                <button
                  className={`settings-page__nav-item ${activeCategory === 'about' ? 'settings-page__nav-item--active' : ''}`}
                  onClick={() => setActiveCategory('about')}
                >
                  <span className="settings-page__nav-icon"><IconInfoCircle size={16} stroke={1.9} /></span>
                  <span className="settings-page__nav-label">About</span>
                </button>
                <div className="settings-page__nav-footer">
                  <Button variant="danger" size="small" onClick={handleResetAll}>
                    Reset All
                  </Button>
                </div>
              </nav>

              <section className="settings-page__category app-scrollbar">
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
              </section>
            </div>
          </div>
        </div>
      </MainContentTemplate>
  );
};
