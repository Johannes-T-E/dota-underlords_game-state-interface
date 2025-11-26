import { Text } from '@/components/ui';
import './StreakBadge.css';

export interface StreakBadgeProps {
  winStreak?: number;
  loseStreak?: number;
  className?: string;
}

export const StreakBadge = ({ winStreak = 0, loseStreak = 0, className = '' }: StreakBadgeProps) => {
  if (winStreak > 0) {
    return (
      <Text className={`streak-badge streak-badge--win ${className}`}>
        {winStreak}
      </Text>
    );
  }
  
  if (loseStreak > 0) {
    return (
      <Text className={`streak-badge streak-badge--loss ${className}`}>
        {loseStreak}
      </Text>
    );
  }
  
  return null;
};

