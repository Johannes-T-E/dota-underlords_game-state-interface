import './ToggleSwitch.css';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const ToggleSwitch = ({ 
  checked, 
  onChange, 
  label,
  disabled = false,
  className = ''
}: ToggleSwitchProps) => {
  return (
    <label className={`toggle-switch ${disabled ? 'toggle-switch--disabled' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="toggle-switch__input"
      />
      <span className="toggle-switch__slider" />
      {label && <span className="toggle-switch__label">{label}</span>}
    </label>
  );
};

