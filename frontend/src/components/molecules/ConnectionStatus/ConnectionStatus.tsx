import { StatusIndicator, Text } from '../../atoms';
import type { ConnectionStatus as ConnectionStatusType } from '../../atoms';
import './ConnectionStatus.css';

export interface ConnectionStatusProps {
  status: ConnectionStatusType;
  className?: string;
}

export const ConnectionStatus = ({ status, className = '' }: ConnectionStatusProps) => {
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`connection-status ${className}`}>
      <StatusIndicator status={status} />
      <Text variant="body">{getStatusText()}</Text>
    </div>
  );
};

