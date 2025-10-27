import './StatusIndicator.css';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface StatusIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export const StatusIndicator = ({ status, className = '' }: StatusIndicatorProps) => {
  return (
    <span 
      className={`status-indicator status-indicator--${status} ${className}`}
      aria-label={status}
    />
  );
};

