import { Text, Spinner } from '../../atoms';
import './EmptyState.css';

export interface EmptyStateProps {
  title: string;
  message: string;
  showSpinner?: boolean;
  icon?: string;
  className?: string;
}

export const EmptyState = ({ 
  title, 
  message, 
  showSpinner = false,
  icon,
  className = ''
}: EmptyStateProps) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state__content">
        {icon && <div className="empty-state__icon">{icon}</div>}
        <Text variant="h2" className="empty-state__title">{title}</Text>
        <Text variant="body" color="secondary" className="empty-state__message">
          {message}
        </Text>
        {showSpinner && (
          <div className="empty-state__spinner">
            <Spinner size="large" />
          </div>
        )}
      </div>
    </div>
  );
};

