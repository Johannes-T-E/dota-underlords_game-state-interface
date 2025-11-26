import { Text } from '@/components/ui';
import './SortableHeader.css';

export interface SortableHeaderProps {
  label: string;
  field: string;
  currentSortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}

export const SortableHeader = ({ 
  label, 
  field, 
  currentSortField,
  sortDirection = 'desc',
  onSort,
  className = '' 
}: SortableHeaderProps) => {
  const isActive = currentSortField === field;
  const arrow = sortDirection === 'desc' ? '▼' : '▲';

  return (
    <div 
      className={`sortable-header ${isActive ? 'sortable-header--active' : ''} ${className}`}
      onClick={() => onSort(field)}
    >
      <Text variant="label" className="sortable-header__label">
        {label} {isActive && arrow}
      </Text>
    </div>
  );
};

