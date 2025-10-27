import { Text } from '../../atoms';
import './RecordDisplay.css';

export interface RecordDisplayProps {
  wins: number | null;
  losses: number | null;
  className?: string;
}

export const RecordDisplay = ({ wins, losses, className = '' }: RecordDisplayProps) => {
  if (wins === null || losses === null) {
    return <Text className={`record-display ${className}`}>—</Text>;
  }

  const winsValue = wins || 0;
  const lossesValue = losses || 0;

  return (
    <Text className={`record-display ${className}`}>
      {winsValue}-{lossesValue}
    </Text>
  );
};

