import { Text } from '@/components/ui';
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
    <div className={`record-display ${className}`}>
      <span className="record-display__wins">{winsValue}</span>
      <span className="record-display__separator">-</span>
      <span className="record-display__losses">{lossesValue}</span>
    </div>
  );
};

