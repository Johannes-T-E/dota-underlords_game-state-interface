import { useAppSelector } from '../../../hooks/redux';
import { ConnectionStatus } from '../../molecules';
import './ConnectionStatusBar.css';

export interface ConnectionStatusBarProps {
  className?: string;
}

export const ConnectionStatusBar = ({ className = '' }: ConnectionStatusBarProps) => {
  const { status } = useAppSelector((state) => state.connection);

  return (
    <div className={`connection-status-bar ${className}`}>
      <ConnectionStatus status={status} />
    </div>
  );
};

