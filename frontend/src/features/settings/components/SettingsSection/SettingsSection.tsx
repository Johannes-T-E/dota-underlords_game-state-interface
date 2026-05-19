import { ReactNode, useState } from 'react';
import './SettingsSection.css';

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
  id?: string;
}

export const SettingsSection = ({
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = true,
  className = '',
  id
}: SettingsSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`settings-section ${className}`} id={id}>
      <div 
        className={`settings-section__header ${collapsible ? 'settings-section__header--clickable' : ''}`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        {collapsible && (
          <span className={`settings-section__toggle ${isOpen ? 'settings-section__toggle--open' : ''}`}>
            ▶
          </span>
        )}
        <div className="settings-section__header-content">
          <h3 className="settings-section__title">{title}</h3>
          {description && <p className="settings-section__description">{description}</p>}
        </div>
      </div>
      {isOpen && (
        <div className="settings-section__content">
          {children}
        </div>
      )}
    </div>
  );
};

