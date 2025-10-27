import { SortableHeader } from '../../molecules';
import './ScoreboardHeader.css';

export type SortField = 'health' | 'record' | 'networth';
export type SortDirection = 'asc' | 'desc';

export interface ScoreboardHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}

export const ScoreboardHeader = ({ 
  sortField, 
  sortDirection, 
  onSort,
  className = ''
}: ScoreboardHeaderProps) => {
  return (
    <div className={`scoreboard-header ${className}`}>
      <div className="scoreboard-header__col scoreboard-header__col--place">#</div>
      <div className="scoreboard-header__col scoreboard-header__col--player">Player</div>
      <div className="scoreboard-header__col scoreboard-header__col--health">
        <SortableHeader
          label="Health"
          field="health"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={() => onSort('health')}
        />
      </div>
      <div className="scoreboard-header__col scoreboard-header__col--record">
        <SortableHeader
          label="Record"
          field="record"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={() => onSort('record')}
        />
      </div>
      <div className="scoreboard-header__col scoreboard-header__col--networth">
        <SortableHeader
          label="Net Worth"
          field="networth"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={() => onSort('networth')}
        />
      </div>
      <div className="scoreboard-header__col scoreboard-header__col--roster">Roster</div>
      <div className="scoreboard-header__col scoreboard-header__col--bench">Bench</div>
    </div>
  );
};

