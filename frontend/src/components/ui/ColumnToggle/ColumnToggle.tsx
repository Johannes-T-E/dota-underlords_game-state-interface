import { Text } from '@/components/ui';
import './ColumnToggle.css';

export interface ColumnToggleProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const ColumnToggle = ({ 
  label, 
  enabled, 
  onChange,
  disabled = false,
  className = '' 
}: ColumnToggleProps) => {
  return (
    <label className={`column-toggle ${className} ${disabled ? 'column-toggle--disabled' : ''}`}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <Text variant="label">{label}</Text>
    </label>
  );
};

