import { Text } from '@/components/ui';
import './NetWorthDisplay.css';

export interface NetWorthDisplayProps {
  netWorth: number | null;
  className?: string;
}

export const NetWorthDisplay = ({ netWorth, className = '' }: NetWorthDisplayProps) => {
  return (
    <Text className={`networth-display ${className}`}>
      {netWorth !== null ? netWorth : '—'}
    </Text>
  );
};
