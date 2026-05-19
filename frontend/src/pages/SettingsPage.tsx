import { useCallback, useState } from 'react';
import { MainContentTemplate } from '@/components/layout';
import { PageHeader } from '@/components/shared';
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
import '@/features/settings/settingsPageLayout.css';
import './SettingsPage.css';

type SettingsCategory = 'appearance' | 'gameplay' | 'advanced' | 'about';

const CATEGORY_META: Record<
  SettingsCategory,
  { title: string; description: string }
> = {
  appearance: {
    title: 'Appearance',
    description: 'Customize visual elements, colors, and display styles',
  },
  gameplay: {
    title: 'Gameplay',
    description: 'Configure scoreboard display and gameplay-related settings',
  },
  advanced: {
    title: 'Advanced',
    description: 'Developer tools, settings management, and advanced options',
  },
  about: {
    title: 'About',
    description: 'Information about the application',
  },
};

const CATEGORY_SECTIONS: Partial<
  Record<SettingsCategory, Array<{ id: string; label: string }>>
> = {
  appearance: [
    { id: 'settings-health', label: 'Health' },
    { id: 'settings-heroes', label: 'Hero portraits' },
    { id: 'settings-animations', label: 'Unit animations' },
  ],
  gameplay: [
    { id: 'settings-columns', label: 'Columns' },
    { id: 'settings-sorting', label: 'Sorting & synergies' },
  ],
  advanced: [
    { id: 'settings-developer', label: 'Developer tools' },
    { id: 'settings-data', label: 'Data' },
  ],
};

export const SettingsPage = () => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');
  const { resetAll, exportSettings, importSettings } = useGlobalSettings();
  const { title, description } = CATEGORY_META[activeCategory];
  const sectionLinks = CATEGORY_SECTIONS[activeCategory];

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
        <PageHeader
          title="Settings"
          icon={<IconSettings size={18} stroke={1.8} />}
        />
        <div className="settings-page__content">
          <div className="settings-page__shell">
            <nav className="settings-page__nav" aria-label="Settings categories">
              <p className="settings-page__nav-heading">Categories</p>
              <button
                type="button"
                className={`settings-page__nav-item ${activeCategory === 'appearance' ? 'settings-page__nav-item--active' : ''}`}
                onClick={() => setActiveCategory('appearance')}
              >
                <span className="settings-page__nav-icon">
                  <IconBrush size={16} stroke={1.9} />
                </span>
                <span className="settings-page__nav-label">Appearance</span>
              </button>
              <button
                type="button"
                className={`settings-page__nav-item ${activeCategory === 'gameplay' ? 'settings-page__nav-item--active' : ''}`}
                onClick={() => setActiveCategory('gameplay')}
              >
                <span className="settings-page__nav-icon">
                  <IconDeviceGamepad2 size={16} stroke={1.9} />
                </span>
                <span className="settings-page__nav-label">Gameplay</span>
              </button>
              <button
                type="button"
                className={`settings-page__nav-item ${activeCategory === 'advanced' ? 'settings-page__nav-item--active' : ''}`}
                onClick={() => setActiveCategory('advanced')}
              >
                <span className="settings-page__nav-icon">
                  <IconAdjustmentsHorizontal size={16} stroke={1.9} />
                </span>
                <span className="settings-page__nav-label">Advanced</span>
              </button>
              <button
                type="button"
                className={`settings-page__nav-item ${activeCategory === 'about' ? 'settings-page__nav-item--active' : ''}`}
                onClick={() => setActiveCategory('about')}
              >
                <span className="settings-page__nav-icon">
                  <IconInfoCircle size={16} stroke={1.9} />
                </span>
                <span className="settings-page__nav-label">About</span>
              </button>
            </nav>

            <section className="settings-page__main app-scrollbar">
              <header className="settings-page__intro">
                <h2 className="settings-page__intro-title">{title}</h2>
                <p className="settings-page__intro-description">{description}</p>
                {sectionLinks && sectionLinks.length > 0 && (
                  <nav className="settings-page__section-jump" aria-label="Sections in this category">
                    <span className="settings-page__section-jump-label">Jump to</span>
                    {sectionLinks.map((link) => (
                      <a key={link.id} href={`#${link.id}`} className="settings-page__section-jump-link">
                        {link.label}
                      </a>
                    ))}
                  </nav>
                )}
              </header>

              <div className="settings-page__form">
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
            </section>
          </div>
        </div>
      </div>
    </MainContentTemplate>
  );
};
