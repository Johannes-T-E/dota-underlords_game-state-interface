import { PhaseIcon, Text } from '@/components/ui';
import './RoundStatus.css';

export interface RoundStatusProps {
  roundNumber: number;
  roundPhase: string;
  className?: string;
}

export const RoundStatus = ({ 
  roundNumber, 
  roundPhase, 
  className = '' 
}: RoundStatusProps) => {
  return (
    <div className={`round-status ${className}`}>
      <div className="round-status__text">
        <Text variant="body" weight="bold">Round {roundNumber}</Text>
        <div className="round-status__phase">
          <PhaseIcon phase={roundPhase} size="small" />
          <Text variant="body">{roundPhase}</Text>
        </div>
      </div>
    </div>
  );
};

