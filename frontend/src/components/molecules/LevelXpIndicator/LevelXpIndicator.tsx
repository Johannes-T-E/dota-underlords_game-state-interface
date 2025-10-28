import { Text } from '../../atoms';
import './LevelXpIndicator.css';

export interface LevelXpIndicatorProps {
  level: number;
  xp: number;
  nextLevelXp: number;
  showXpText?: boolean;
  className?: string;
}

export const LevelXpIndicator = ({ 
  level, 
  xp, 
  nextLevelXp, 
  showXpText = true,
  className = '' 
}: LevelXpIndicatorProps) => {
  const xpProgress = Math.min((xp / nextLevelXp) * 100, 100);
  
  return (
    <div className={`level-xp-indicator ${className}`}>
      <div className="level-circle">
        <Text variant="label" className="level-text">{level}</Text>
        {showXpText && (
          <Text variant="label" className="xp-text">{xp}/{nextLevelXp}</Text>
        )}
      </div>
      <div 
        className="xp-progress-ring"
        style={{ '--xp-progress': xpProgress } as React.CSSProperties}
      >
        <div className="xp-progress-fill"></div>
      </div>
    </div>
  );
};

