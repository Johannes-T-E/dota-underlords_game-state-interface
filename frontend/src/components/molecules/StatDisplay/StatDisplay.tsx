import { Icon, Text } from '../../atoms';
import type { IconType } from '../../atoms';
import './StatDisplay.css';

export interface StatDisplayProps {
  type: IconType;
  value: number | string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const StatDisplay = ({ type, value, size = 'medium', className = '' }: StatDisplayProps) => {
  return (
    <div className={`stat-display stat-display--${size} ${className}`}>
      <Icon type={type} size={size === 'large' ? 'large' : 'small'} className="stat-display__icon" />
      <Text variant="label" className="stat-display__value">{value}</Text>
    </div>
  );
};

