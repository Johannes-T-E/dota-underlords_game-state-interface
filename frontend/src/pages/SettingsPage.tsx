import { AppLayout, MainContentTemplate } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { IconSettings } from '@tabler/icons-react';
import './SettingsPage.css';

export const SettingsPage = () => {
  return (
    <AppLayout>
      <MainContentTemplate centered={false} className="settings-page">
        <div className="settings-page__container">
          <PageHeader title="Settings" titleIcon="⚙️" icon={<IconSettings size={18} stroke={1.8} />} />
          <div className="settings-page__content">
            <div className="settings-page__panel">
              <h2 className="settings-page__panel-title">Application Settings</h2>
              <p className="settings-page__panel-text">
                Settings have moved to a dedicated page so they follow the same page layout as the rest of the app.
              </p>
            </div>
          </div>
        </div>
      </MainContentTemplate>
    </AppLayout>
  );
};
