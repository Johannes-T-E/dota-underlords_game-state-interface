import { ChangeEvent } from '../ChangeEvent/ChangeEvent';
import type { ChangeEventType } from '../ChangeEvent/ChangeEvent';
import './ChangeBar.css';

export interface ChangeEventData {
  type: ChangeEventType;
  delta: number;
  timestamp?: number;
}

export interface ChangeBarProps {
  events: ChangeEventData[];
  className?: string;
}

export const ChangeBar = ({ events, className = '' }: ChangeBarProps) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`change-bar ${className}`}>
      {events.map((event, idx) => (
        <ChangeEvent
          key={idx}
          type={event.type}
          delta={event.delta}
          timestamp={event.timestamp}
        />
      ))}
    </div>
  );
};

