import { ReactNode } from 'react';
import './SettingsRow.css';

export interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export const SettingsRow = ({
  label,
  description,
  children,
  layout = 'horizontal',
  className = ''
}: SettingsRowProps) => {
  return (
    <div className={`settings-row settings-row--${layout} ${className}`}>
      <div className="settings-row__label-section">
        <label className="settings-row__label">{label}</label>
        {description && <p className="settings-row__description">{description}</p>}
      </div>
      <div className="settings-row__control">
        {children}
      </div>
    </div>
  );
};

