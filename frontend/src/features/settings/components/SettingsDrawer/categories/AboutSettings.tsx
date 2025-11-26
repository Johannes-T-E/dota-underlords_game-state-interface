import { SettingsSection } from '../../SettingsSection/SettingsSection';
import { SettingsGroup } from '../../SettingsGroup/SettingsGroup';

export const AboutSettings = () => {
  return (
    <div className="settings-category">
      <div className="settings-category__header">
        <h2 className="settings-category__title">About</h2>
        <p className="settings-category__description">
          Information about the application
        </p>
      </div>

      {/* App Information */}
      <SettingsSection 
        title="Application" 
        defaultOpen={true}
        collapsible={false}
      >
        <SettingsGroup variant="card">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '8px'
          }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h3 style={{
                color: 'var(--text-color)',
                fontSize: '28px',
                fontWeight: 700,
                margin: '0 0 8px 0'
              }}>
                Underlords GSI Unified
              </h3>
              <p style={{
                color: 'var(--text-secondary, #b9bbbe)',
                fontSize: '16px',
                margin: 0
              }}>
                Version 3.0
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: 'var(--primary-color)',
              borderRadius: '6px',
              border: '1px solid var(--border-color)'
            }}>
              <p style={{
                color: 'var(--text-color)',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0
              }}>
                A modern web application for tracking and visualizing Dota Underlords matches in real-time using Game State Integration (GSI).
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 style={{
                color: 'var(--text-color)',
                fontSize: '16px',
                fontWeight: 600,
                margin: '0 0 12px 0'
              }}>
                Features:
              </h4>
              <ul style={{
                color: 'var(--text-secondary, #b9bbbe)',
                fontSize: '14px',
                lineHeight: '1.8',
                margin: 0,
                paddingLeft: '20px'
              }}>
                <li>Real-time match tracking via GSI</li>
                <li>Interactive scoreboard with customizable columns</li>
                <li>Match history and detailed statistics</li>
                <li>Highly customizable appearance settings</li>
                <li>Modern, responsive UI with atomic design principles</li>
              </ul>
            </div>
          </div>
        </SettingsGroup>
      </SettingsSection>

      {/* Links & Resources */}
      <SettingsSection 
        title="Links & Resources" 
        defaultOpen={true}
        collapsible={false}
      >
        <SettingsGroup variant="card">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--primary-color)',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-color)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5865f2';
                e.currentTarget.style.background = 'rgba(88, 101, 242, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--primary-color)';
              }}
            >
              <span style={{ fontSize: '24px' }}>📦</span>
              <span style={{ flex: 1 }}>GitHub Repository</span>
              <span style={{ fontSize: '16px' }}>↗</span>
            </a>

            <a
              href="https://github.com/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--primary-color)',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-color)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5865f2';
                e.currentTarget.style.background = 'rgba(88, 101, 242, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--primary-color)';
              }}
            >
              <span style={{ fontSize: '24px' }}>🐛</span>
              <span style={{ flex: 1 }}>Report an Issue</span>
              <span style={{ fontSize: '16px' }}>↗</span>
            </a>

            <a
              href="https://github.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--primary-color)',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-color)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5865f2';
                e.currentTarget.style.background = 'rgba(88, 101, 242, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--primary-color)';
              }}
            >
              <span style={{ fontSize: '24px' }}>📚</span>
              <span style={{ flex: 1 }}>Documentation</span>
              <span style={{ fontSize: '16px' }}>↗</span>
            </a>
          </div>
        </SettingsGroup>
      </SettingsSection>

      {/* Technical Info */}
      <SettingsSection 
        title="Technical Information" 
        defaultOpen={false}
      >
        <SettingsGroup variant="card">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary, #b9bbbe)' }}>Frontend:</span>
              <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>React + TypeScript</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary, #b9bbbe)' }}>Backend:</span>
              <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>Python (Flask)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary, #b9bbbe)' }}>Database:</span>
              <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>SQLite</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary, #b9bbbe)' }}>Real-time:</span>
              <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>WebSocket</span>
            </div>
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '12px', 
              borderTop: '1px solid var(--border-color)' 
            }}>
              <span style={{ color: 'var(--text-secondary, #b9bbbe)' }}>Settings Location:</span>
              <code style={{
                display: 'block',
                marginTop: '4px',
                padding: '8px',
                background: 'var(--primary-color)',
                borderRadius: '4px',
                color: 'var(--text-color)',
                fontSize: '12px',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                localStorage.getItem('appSettings')
              </code>
            </div>
          </div>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
};

