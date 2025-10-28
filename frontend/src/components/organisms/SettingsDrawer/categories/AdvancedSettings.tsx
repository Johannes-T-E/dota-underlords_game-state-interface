import { SettingsSection, SettingsGroup } from '../../../molecules';
import { Button } from '../../../atoms/Button/Button';
import { websocketService } from '../../../../services/websocket';
import type { MatchData } from '../../../../types';

export interface AdvancedSettingsProps {
  onExport: () => void;
  onImport: () => void;
  onResetAll: () => void;
}

export const AdvancedSettings = ({ onExport, onImport, onResetAll }: AdvancedSettingsProps) => {
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Capture Match Data */}
            <div style={{
              padding: '20px',
              background: 'var(--primary-color)',
              borderRadius: '8px',
              border: `2px solid ${isCaptureEnabled ? '#5865f2' : 'var(--border-color)'}`,
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>📸</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    color: 'var(--text-color)', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    margin: 0 
                  }}>
                    Capture Match Data
                  </h4>
                  <p style={{ 
                    color: 'var(--text-secondary, #b9bbbe)', 
                    fontSize: '13px', 
                    margin: '4px 0 0 0' 
                  }}>
                    Next match update will auto-download as JSON
                  </p>
                </div>
              </div>
              <Button
                variant={isCaptureEnabled ? 'primary' : 'secondary'}
                size="medium"
                onClick={handleSaveNextUpdate}
                style={{ width: '100%' }}
                className={isCaptureEnabled ? 'pulse-animation' : ''}
              >
                {isCaptureEnabled ? '⏳ Waiting for Update...' : '▶️ Enable Capture Mode'}
              </Button>
            </div>

            {/* Replay Match Data */}
            <div style={{
              padding: '20px',
              background: 'var(--primary-color)',
              borderRadius: '8px',
              border: '2px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>📁</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    color: 'var(--text-color)', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    margin: 0 
                  }}>
                    Replay Match Data
                  </h4>
                  <p style={{ 
                    color: 'var(--text-secondary, #b9bbbe)', 
                    fontSize: '13px', 
                    margin: '4px 0 0 0' 
                  }}>
                    Simulate a live match using saved data
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="medium"
                onClick={handleLoadDebugData}
                style={{ width: '100%' }}
              >
                📂 Load Debug JSON File
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Backup Settings */}
            <div style={{
              padding: '20px',
              background: 'var(--primary-color)',
              borderRadius: '8px',
              border: '2px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>💾</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    color: 'var(--text-color)', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    margin: 0 
                  }}>
                    Backup Settings
                  </h4>
                  <p style={{ 
                    color: 'var(--text-secondary, #b9bbbe)', 
                    fontSize: '13px', 
                    margin: '4px 0 0 0' 
                  }}>
                    Export all settings to a JSON file
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="medium"
                onClick={onExport}
                style={{ width: '100%' }}
              >
                💾 Export Settings
              </Button>
            </div>

            {/* Restore Settings */}
            <div style={{
              padding: '20px',
              background: 'var(--primary-color)',
              borderRadius: '8px',
              border: '2px solid rgba(251, 191, 36, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>📥</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    color: 'var(--text-color)', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    margin: 0 
                  }}>
                    Restore Settings
                  </h4>
                  <p style={{ 
                    color: 'var(--text-secondary, #b9bbbe)', 
                    fontSize: '13px', 
                    margin: '4px 0 0 0' 
                  }}>
                    ⚠️ Will override current settings
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="medium"
                onClick={onImport}
                style={{ width: '100%' }}
              >
                📥 Import Settings
              </Button>
            </div>

            {/* Reset Everything */}
            <div style={{
              padding: '20px',
              background: 'var(--primary-color)',
              borderRadius: '8px',
              border: '2px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>🔄</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    color: '#ef4444', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    margin: 0 
                  }}>
                    Reset Everything
                  </h4>
                  <p style={{ 
                    color: 'var(--text-secondary, #b9bbbe)', 
                    fontSize: '13px', 
                    margin: '4px 0 0 0' 
                  }}>
                    ⚠️ This action cannot be undone
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="medium"
                onClick={onResetAll}
                style={{ width: '100%' }}
              >
                🔄 Reset All Settings
              </Button>
            </div>
          </div>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
};

