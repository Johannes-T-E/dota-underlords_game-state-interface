import { useAppSelector } from '../../hooks/redux';

export const ConnectionStatus = () => {
  const { status } = useAppSelector((state) => state.connection);

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

  const getStatusClass = () => {
    return status === 'connected' ? 'connected' : 'disconnected';
  };

  return (
    <div className="connection-status">
      <span className={`connection-indicator ${getStatusClass()}`}></span>
      <span id="connectionText">{getStatusText()}</span>
    </div>
  );
};

