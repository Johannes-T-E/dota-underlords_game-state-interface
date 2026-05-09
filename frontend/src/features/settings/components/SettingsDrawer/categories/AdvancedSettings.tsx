import { Button } from '@/components/ui';
import { useState } from 'react';
import { SettingsSection } from '../../SettingsSection/SettingsSection';
import { SettingsGroup } from '../../SettingsGroup/SettingsGroup';
import { websocketService } from '@/services/websocket';
import type { MatchData } from '@/types';
import './SettingsCategories.css';

export interface AdvancedSettingsProps {
  onExport: () => void;
  onImport: () => void;
  onResetAll: () => void;
}

export const AdvancedSettings = ({ onExport, onImport, onResetAll }: AdvancedSettingsProps) => {
  const [isOrganizingBench, setIsOrganizingBench] = useState(false);

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

  const handleOrganizeBench = async (dryRun: boolean) => {
    if (isOrganizingBench) {
      return;
    }

    setIsOrganizingBench(true);
    try {
      const response = await fetch('/api/organize_bench', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dry_run: dryRun }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.status !== 'success') {
        const errorMessage = payload?.message || payload?.error || 'Failed to organize bench.';
        throw new Error(errorMessage);
      }

      const movesExecuted = payload?.moves_executed ?? 0;
      if (dryRun) {
        const plannedMoves = payload?.diagnostics?.planned_moves?.length ?? movesExecuted;
        console.log('[Bench] Dry-run complete.', { plannedMoves, movesExecuted });
      } else {
        console.log('[Bench] Organize complete.', { movesExecuted });
      }
    } catch (error) {
      const fallbackMessage = dryRun ? 'Failed to run bench dry-run.' : 'Failed to organize bench.';
      const message = error instanceof Error ? error.message : fallbackMessage;
      console.error('[Bench]', message, error);
    } finally {
      setIsOrganizingBench(false);
    }
  };

  const isCaptureEnabled = websocketService.isCaptureEnabled();

  return (
    <div className="settings-category">
      <div className="settings-category__header">
        <h2 className="settings-category__title">Advanced</h2>
        <p className="settings-category__description">
          Developer tools, settings management, and advanced options
        </p>
      </div>

      {/* Developer Tools */}
      <SettingsSection 
        title="Developer Tools" 
        description="Tools for testing and development. Capture live match data or replay saved matches."
        defaultOpen={true}
      >
        <SettingsGroup variant="card">
          <div className="settings-card-stack">
            {/* Capture Match Data */}
            <div className={`settings-card ${isCaptureEnabled ? 'settings-card--active' : ''}`}>
              <div className="settings-card__header">
                <div className="settings-card__content">
                  <h4 className="settings-card__title">Capture Match Data</h4>
                  <p className="settings-card__description">Next match update will auto-download as JSON</p>
                </div>
              </div>
              <Button
                variant={isCaptureEnabled ? 'primary' : 'secondary'}
                size="medium"
                onClick={handleSaveNextUpdate}
                className={`settings-button--full ${isCaptureEnabled ? 'pulse-animation' : ''}`}
              >
                {isCaptureEnabled ? 'Waiting for update...' : 'Enable capture mode'}
              </Button>
            </div>

            {/* Replay Match Data */}
            <div className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__content">
                  <h4 className="settings-card__title">Replay Match Data</h4>
                  <p className="settings-card__description">Simulate a live match using saved data</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="medium"
                onClick={handleLoadDebugData}
                className="settings-button--full"
              >
                Load debug JSON file
              </Button>
            </div>

            {/* Organize Bench */}
            <div className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__content">
                  <h4 className="settings-card__title">Organize Bench</h4>
                  <p className="settings-card__description">
                    Focuses Underlords and reorders your bench with backend automation
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="medium"
                onClick={() => handleOrganizeBench(false)}
                disabled={isOrganizingBench}
                className="settings-button--full"
              >
                {isOrganizingBench ? 'Organizing bench...' : 'Organize bench now'}
              </Button>
              <Button
                variant="ghost"
                size="medium"
                onClick={() => handleOrganizeBench(true)}
                disabled={isOrganizingBench}
                className="settings-button--full"
              >
                {isOrganizingBench ? 'Running dry-run...' : 'Dry-run bench organize'}
              </Button>
            </div>
          </div>
        </SettingsGroup>
      </SettingsSection>

      {/* Settings Management */}
      <SettingsSection 
        title="Settings Management" 
        description="Backup, restore, or reset all application settings"
        defaultOpen={true}
      >
        <SettingsGroup variant="card">
          <div className="settings-card-stack">
            {/* Backup Settings */}
            <div className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__content">
                  <h4 className="settings-card__title">Backup Settings</h4>
                  <p className="settings-card__description">Export all settings to a JSON file</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="medium"
                onClick={onExport}
                className="settings-button--full"
              >
                Export settings
              </Button>
            </div>

            {/* Restore Settings */}
            <div className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__content">
                  <h4 className="settings-card__title">Restore Settings</h4>
                  <p className="settings-card__description">Will override current settings</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="medium"
                onClick={onImport}
                className="settings-button--full"
              >
                Import settings
              </Button>
            </div>

            {/* Reset Everything */}
            <div className="settings-card">
              <div className="settings-card__header">
                <div className="settings-card__content">
                  <h4 className="settings-card__title">Reset Everything</h4>
                  <p className="settings-card__description">This action cannot be undone</p>
                </div>
              </div>
              <Button
                variant="danger"
                size="medium"
                onClick={onResetAll}
                className="settings-button--full"
              >
                Reset All Settings
              </Button>
            </div>
          </div>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
};

