import { Badge } from '../../atoms';
import './StreakBadge.css';

export interface StreakBadgeProps {
  winStreak?: number;
  loseStreak?: number;
  className?: string;
}

export const StreakBadge = ({ winStreak = 0, loseStreak = 0, className = '' }: StreakBadgeProps) => {
  if (winStreak > 0) {
    return (
      <Badge variant="win" className={`streak-badge ${className}`}>
        W{winStreak}
      </Badge>
    );
  }
  
  if (loseStreak > 0) {
    return (
      <Badge variant="loss" className={`streak-badge ${className}`}>
        L{loseStreak}
      </Badge>
    );
  }
  
  return null;
};

