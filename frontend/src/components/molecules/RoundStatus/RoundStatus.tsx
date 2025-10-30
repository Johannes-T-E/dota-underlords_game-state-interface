import { PhaseIcon, Text } from '../../atoms';
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
        <Text variant="label" weight="bold">Round {roundNumber}</Text>
        <div className="round-status__phase">
          <PhaseIcon phase={roundPhase} size="small" />
          <Text variant="label">{roundPhase}</Text>
        </div>
      </div>
    </div>
  );
};

