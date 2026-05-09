import { SettingsSection } from '../../SettingsSection/SettingsSection';
import { SettingsGroup } from '../../SettingsGroup/SettingsGroup';
import './SettingsCategories.css';

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
          <div className="settings-about">
            <div className="settings-about__brand">
              <h3 className="settings-about__name">Underlords GSI Unified</h3>
              <p className="settings-about__version">Version 3.0</p>
            </div>

            <div className="settings-about__blurb">
              <p>
                A modern web application for tracking and visualizing Dota Underlords matches in real-time using Game State Integration (GSI).
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="settings-about__features-title">Features:</h4>
              <ul className="settings-about__features-list">
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
          <div className="settings-link-list">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="settings-link-item"
            >
              <span className="settings-link-item__label">GitHub Repository</span>
              <span className="settings-link-item__arrow">&gt;</span>
            </a>

            <a
              href="https://github.com/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="settings-link-item"
            >
              <span className="settings-link-item__label">Report an Issue</span>
              <span className="settings-link-item__arrow">&gt;</span>
            </a>

            <a
              href="https://github.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="settings-link-item"
            >
              <span className="settings-link-item__label">Documentation</span>
              <span className="settings-link-item__arrow">&gt;</span>
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
          <div className="settings-tech">
            <div className="settings-tech__row">
              <span className="settings-tech__label">Frontend:</span>
              <span className="settings-tech__value">React + TypeScript</span>
            </div>
            <div className="settings-tech__row">
              <span className="settings-tech__label">Backend:</span>
              <span className="settings-tech__value">Python (Flask)</span>
            </div>
            <div className="settings-tech__row">
              <span className="settings-tech__label">Database:</span>
              <span className="settings-tech__value">SQLite</span>
            </div>
            <div className="settings-tech__row">
              <span className="settings-tech__label">Real-time:</span>
              <span className="settings-tech__value">WebSocket</span>
            </div>
            <div className="settings-tech__location">
              <span className="settings-tech__label">Settings Location:</span>
              <code className="settings-tech__code">
                localStorage.getItem('appSettings')
              </code>
            </div>
          </div>
        </SettingsGroup>
      </SettingsSection>
    </div>
  );
};

