import { Text } from '../../atoms';
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
  label = 'Round:',
  className = '' 
}: RoundInfoProps) => {
  return (
    <div className={`round-info ${className}`}>
      <Text variant="label">{label}</Text>
      <Text variant="body">
        {roundNumber} ({roundPhase})
      </Text>
    </div>
  );
};

