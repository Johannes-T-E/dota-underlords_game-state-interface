import { ReactNode } from 'react';
import './IconRadio.css';

export interface IconRadioProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const IconRadio = ({
  name,
  value,
  checked,
  onChange,
  label,
  icon,
  description,
  disabled = false,
  className = ''
}: IconRadioProps) => {
  return (
    <label className={`icon-radio ${checked ? 'icon-radio--checked' : ''} ${disabled ? 'icon-radio--disabled' : ''} ${className}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="icon-radio__input"
      />
      <div className="icon-radio__content">
        {icon && <span className="icon-radio__icon">{icon}</span>}
        <div className="icon-radio__text">
          <span className="icon-radio__label">{label}</span>
          {description && <span className="icon-radio__description">{description}</span>}
        </div>
      </div>
    </label>
  );
};

