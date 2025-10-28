import { ReactNode } from 'react';
import './PresetButton.css';

export interface PresetButtonProps {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick: () => void;
  preview?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const PresetButton = ({
  label,
  icon,
  selected = false,
  onClick,
  preview,
  disabled = false,
  className = ''
}: PresetButtonProps) => {
  return (
    <button
      className={`preset-button ${selected ? 'preset-button--selected' : ''} ${disabled ? 'preset-button--disabled' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {icon && <span className="preset-button__icon">{icon}</span>}
      <span className="preset-button__label">{label}</span>
      {preview && <span className="preset-button__preview">{preview}</span>}
    </button>
  );
};

