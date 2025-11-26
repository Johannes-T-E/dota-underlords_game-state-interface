import { useState } from 'react';
import { SortableHeader } from '@/components/ui';
import type { ScoreboardColumnConfig } from '@/types';
import './ScoreboardHeader.css';

export type SortField = 'health' | 'record' | 'networth';
export type SortDirection = 'asc' | 'desc';

// Column metadata for drag-and-drop functionality
const COLUMN_METADATA = {
  place: { label: '#', sortable: false },
  player: { label: 'Player', sortable: false },
  playerName: { label: 'Player', sortable: false },
  level: { label: 'Level', sortable: false },
  gold: { label: 'Gold', sortable: false },
  streak: { label: 'Streak', sortable: false },
  health: { label: 'Health', sortable: true },
  record: { label: 'Record', sortable: true },
  networth: { label: 'Net Worth', sortable: true },
  roster: { label: 'Roster', sortable: false },
  underlord: { label: 'Underlord', sortable: false },
  contraptions: { label: 'Contraptions', sortable: false },
  bench: { label: 'Bench', sortable: false }
} as const;

export interface ScoreboardHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  visibleColumns?: ScoreboardColumnConfig;
  columnOrder?: string[];
  onColumnReorder?: (newOrder: string[]) => void;
  className?: string;
}

export const ScoreboardHeader = ({ 
  sortField, 
  sortDirection, 
  onSort,
  visibleColumns,
  columnOrder,
  onColumnReorder,
  className = ''
}: ScoreboardHeaderProps) => {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const defaultVisible: ScoreboardColumnConfig = {
    place: true,
    player: false,
    playerName: true,
    level: true,
    gold: true,
    streak: true,
    health: true,
    record: true,
    networth: true,
    roster: true,
    underlord: true,
    contraptions: true,
    bench: true
  };
  
  const config = visibleColumns || defaultVisible;
  
  // Use provided columnOrder or default order
  const DEFAULT_COLUMN_ORDER = ['place', 'playerName', 'level', 'gold', 'streak', 'health', 'record', 'networth', 'roster', 'underlord', 'contraptions', 'bench'];
  const currentOrder = columnOrder || DEFAULT_COLUMN_ORDER;
  
  // Filter visible columns in the specified order
  const visibleOrderedColumns = currentOrder.filter(columnKey => 
    config[columnKey as keyof ScoreboardColumnConfig] === true
  );

  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnKey);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(columnKey);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    
    if (!draggedColumn || !onColumnReorder) return;
    
    const newOrder = [...currentOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumn);
    
    if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
      // Remove dragged column from its current position
      newOrder.splice(draggedIndex, 1);
      // Insert it at the target position
      newOrder.splice(targetIndex, 0, draggedColumn);
      
      onColumnReorder(newOrder);
    }
    
    setDraggedColumn(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDropTarget(null);
  };

  const renderColumn = (columnKey: string) => {
    const metadata = COLUMN_METADATA[columnKey as keyof typeof COLUMN_METADATA];
    if (!metadata) return null;

    const isDragging = draggedColumn === columnKey;
    const isDropTarget = dropTarget === columnKey;
    
    // Convert camelCase to kebab-case for CSS class names
    const kebabCaseKey = columnKey.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    const columnClass = `scoreboard-header__col scoreboard-header__col--${kebabCaseKey} ${
      isDragging ? 'scoreboard-header__col--dragging' : ''
    } ${isDropTarget ? 'scoreboard-header__col--drop-target' : ''}`;

    if (metadata.sortable && (columnKey === 'health' || columnKey === 'record' || columnKey === 'networth')) {
      return (
        <div
          key={columnKey}
          className={columnClass}
          draggable
          onDragStart={(e) => handleDragStart(e, columnKey)}
          onDragOver={(e) => handleDragOver(e, columnKey)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, columnKey)}
          onDragEnd={handleDragEnd}
        >
          <SortableHeader
            label={metadata.label}
            field={columnKey as SortField}
            currentSortField={sortField}
            sortDirection={sortDirection}
            onSort={() => onSort(columnKey as SortField)}
          />
        </div>
      );
    }

    return (
      <div
        key={columnKey}
        className={columnClass}
        draggable
        onDragStart={(e) => handleDragStart(e, columnKey)}
        onDragOver={(e) => handleDragOver(e, columnKey)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, columnKey)}
        onDragEnd={handleDragEnd}
      >
        {metadata.label}
      </div>
    );
  };

  return (
    <div className={`scoreboard-header ${className}`}>
      {visibleOrderedColumns.map(renderColumn)}
    </div>
  );
};

