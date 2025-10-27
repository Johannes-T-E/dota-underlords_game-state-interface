import { Text } from '../../atoms';
import './DurationDisplay.css';

export interface DurationDisplayProps {
  startTime: string | Date;
  endTime?: string | Date | null;
  showLabel?: boolean;
  className?: string;
}

export const DurationDisplay = ({ 
  startTime, 
  endTime, 
  showLabel = false,
  className = '' 
}: DurationDisplayProps) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  
  const duration = end.getTime() - start.getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  if (!endTime) {
    return <Text className={`duration-display ${className}`}>—</Text>;
  }

  return (
    <div className={`duration-display ${className}`}>
      {showLabel && <Text variant="label">Duration:</Text>}
      <Text variant="body">{durationText}</Text>
    </div>
  );
};

