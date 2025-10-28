import { SortableHeader } from '../../molecules';
import type { ScoreboardColumnConfig } from '../../../types';
import './ScoreboardHeader.css';

export type SortField = 'health' | 'record' | 'networth';
export type SortDirection = 'asc' | 'desc';

export interface ScoreboardHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  visibleColumns?: ScoreboardColumnConfig;
  className?: string;
}

export const ScoreboardHeader = ({ 
  sortField, 
  sortDirection, 
  onSort,
  visibleColumns,
  className = ''
}: ScoreboardHeaderProps) => {
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
    bench: true
  };
  
  const config = visibleColumns || defaultVisible;

  return (
    <div className={`scoreboard-header ${className}`}>
      {config.place && <div className="scoreboard-header__col scoreboard-header__col--place">#</div>}
      {config.player && <div className="scoreboard-header__col scoreboard-header__col--player">Player</div>}
      {config.playerName && <div className="scoreboard-header__col scoreboard-header__col--player-name">Player</div>}
      {config.level && <div className="scoreboard-header__col scoreboard-header__col--level">Level</div>}
      {config.gold && <div className="scoreboard-header__col scoreboard-header__col--gold">Gold</div>}
      {config.streak && <div className="scoreboard-header__col scoreboard-header__col--streak">Streak</div>}
      {config.health && (
        <div className="scoreboard-header__col scoreboard-header__col--health">
          <SortableHeader
            label="Health"
            field="health"
            currentSortField={sortField}
            sortDirection={sortDirection}
            onSort={() => onSort('health')}
          />
        </div>
      )}
      {config.record && (
        <div className="scoreboard-header__col scoreboard-header__col--record">
          <SortableHeader
            label="Record"
            field="record"
            currentSortField={sortField}
            sortDirection={sortDirection}
            onSort={() => onSort('record')}
          />
        </div>
      )}
      {config.networth && (
        <div className="scoreboard-header__col scoreboard-header__col--networth">
          <SortableHeader
            label="Net Worth"
            field="networth"
            currentSortField={sortField}
            sortDirection={sortDirection}
            onSort={() => onSort('networth')}
          />
        </div>
      )}
      {config.roster && <div className="scoreboard-header__col scoreboard-header__col--roster">Roster</div>}
      {config.bench && <div className="scoreboard-header__col scoreboard-header__col--bench">Bench</div>}
    </div>
  );
};

