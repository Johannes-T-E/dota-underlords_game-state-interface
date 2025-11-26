import { Text, PhaseIcon } from '@/components/ui';
import './RoundInfo.css';

export interface RoundInfoProps {
  roundNumber: number;
  roundPhase: string;
  label?: string;
  className?: string;
}

export const RoundInfo = ({ 
  roundNumber, 
  roundPhase, 
  label = 'Round',
  className = '' 
}: RoundInfoProps) => {
  return (
    <div className={`round-info ${className}`}>
      <PhaseIcon phase={roundPhase} size="small" />
      <div className="round-info__text">
        <Text variant="label" weight="bold">{label} {roundNumber}</Text>
        <Text variant="label">{roundPhase}</Text>
      </div>
    </div>
  );
};

