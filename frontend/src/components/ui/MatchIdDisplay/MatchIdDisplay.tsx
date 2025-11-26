import { Text } from '@/components/ui';
import './MatchIdDisplay.css';

export interface MatchIdDisplayProps {
  matchId: string;
  label?: string;
  className?: string;
}

export const MatchIdDisplay = ({ matchId, label = 'Match:', className = '' }: MatchIdDisplayProps) => {
  return (
    <div className={`match-id-display ${className}`}>
      {label && <Text variant="label">{label}</Text>}
      <Text variant="code" className="match-id-display__id">{matchId}</Text>
    </div>
  );
};

