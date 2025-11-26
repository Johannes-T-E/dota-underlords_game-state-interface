import { ReactNode } from 'react';
import './SettingsGroup.css';

export interface SettingsGroupProps {
  title?: string;
  children: ReactNode;
  variant?: 'default' | 'card' | 'transparent';
  className?: string;
}

export const SettingsGroup = ({
  title,
  children,
  variant = 'default',
  className = ''
}: SettingsGroupProps) => {
  return (
    <div className={`settings-group settings-group--${variant} ${className}`}>
      {title && <h4 className="settings-group__title">{title}</h4>}
      <div className="settings-group__content">
        {children}
      </div>
    </div>
  );
};

